/** This file is part of IGB-FUCHS.
 *
 * Copyright © 2024-2025 Hauke Dämpfling (haukex@zero-g.net)
 * at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
 * Berlin, Germany, <https://www.igb-berlin.de/>
 *
 * IGB-FUCHS is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * IGB-FUCHS is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * IGB-FUCHS. If not, see <https://www.gnu.org/licenses/>.
 */
import { CustomChangeEvent, CustomStackEvent } from '../events'
import { jsx, safeCast } from '@haukex/simple-jsx-dom'
import { StyleValue } from '../types/common'
import { assert, paranoia } from '../utils'
import { Slider } from '../slider'
import { HomePage } from './home'

export interface StackAble {  // the only bits of the Editor class we care about
  readonly el :HTMLElement
  readonly style :StyleValue
  readonly unsavedChanges :boolean
  currentName(short ?:boolean) :string
  requestClose() :Promise<boolean>
  // In regards to the following `close` and `shown` callbacks, see also the discussion in CustomStackEvent
  close() :Promise<void>
  shown(pushNotPop :boolean) :void
  nextButtonText() :HTMLElement|null
  doNext() :Promise<void>
  doSaveAndClose() :Promise<boolean>
  checkValidity(saving :boolean, andClose :boolean) :Promise<['good'|'warn'|'error', string]>
}

interface HistoryState { stackLen :number }
function isHistoryState(o :unknown) :o is HistoryState {
  return !!( o && typeof o === 'object' && Object.keys(o).length===1 && 'stackLen' in o && typeof o.stackLen === 'number' && o.stackLen>0 ) }

export class EditorStack {
  readonly el :HTMLElement = <div class="editor-stack"></div>
  private readonly navList :HTMLElement = <div class="navbar-nav"></div>
  private readonly navPageTitle :HTMLElement
  private readonly stack :StackAble[] = []
  private readonly origTitle = document.title
  private readonly footer
  constructor(footer :HTMLElement) {
    this.footer = footer
    this.navPageTitle = safeCast(HTMLElement, document.getElementById('navPageTitle'))
  }
  private redrawNavbar() {
    this.navList.replaceChildren(
      ...this.stack.map((_,i) => {
        // link contents will be filled by `restyleNavbar`
        const link = <a class="nav-link text-nowrap" href='#'></a>
        if (i===this.stack.length-1) {
          link.classList.add('active')
          link.setAttribute('aria-current','page')
          link.addEventListener('click', event => event.preventDefault())
        }
        else {
          assert(i>=0 && i<this.stack.length-1)
          link.addEventListener('click', event => {
            event.preventDefault()
            const howMany = -this.stack.length+1+i
            console.debug('navbar go',howMany)
            assert(howMany<0)
            history.go(howMany)  // handled by popstate event
          })
        }
        return link
      }) )
    this.restyleNavbar()
  }
  private restyleNavbar() {
    let anyUnsaved = false as boolean
    Array.from(this.navList.children).forEach((l,i) => {
      assert(l instanceof HTMLAnchorElement)
      const s = this.stack[i]
      assert(s, `i=${i} stack.length=${this.stack.length} link=${l.innerHTML}`)
      l.classList.toggle('unsaved', s.unsavedChanges)
      l.title = i ? `${s.style.fullTitle} "${s.currentName()}"` : s.currentName()
      l.replaceChildren(<span class={`editor-${s.style.cssId}-text`}><i class={'bi-'+s.style.icon}/> {s.currentName(true)}</span>)
      if (s.unsavedChanges) anyUnsaved = true
    })
    const top = this.top
    this.navPageTitle.title = this.stack.length>1 ? `${top.style.fullTitle} "${top.currentName()}"` : top.currentName()
    this.navPageTitle.replaceChildren(<span class={`editor-${top.style.cssId}-text`}><i class={`bi-${top.style.icon}`}/> {top.currentName(true)}</span>)
    document.title = this.origTitle + (anyUnsaved?'*':'')
  }
  private get homePage() :HomePage {
    const hp = this.stack[0]
    assert(hp instanceof HomePage)
    return hp
  }
  /** Signal the HomePage that an import has occurred. */
  signalImport() { this.homePage.signalImport() }
  initialize(navbarMain :HTMLElement, homePage :HomePage) {
    assert(this.stack.length===0)
    // note the home page *always* stays on the stack
    this.stack.push(homePage)
    this.el.appendChild(homePage.el)
    navbarMain.replaceChildren(this.navList)
    this.redrawNavbar()

    // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
    window.addEventListener('beforeunload', event => {
      if ( this.stack.some(s => s.unsavedChanges) ) {
        event.preventDefault()
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        event.returnValue = true  // MDN says it's best practice to still do this despite deprecation
        return true
      }
      return undefined
    })

    window.addEventListener('popstate', async event => {
      if (isHistoryState(event.state)) {
        if ( event.state.stackLen === this.stack.length ) {
          console.debug('ignoring popstate b/c target stackLen',event.state.stackLen,'=== stack.length',this.stack.length)
        }
        else if ( event.state.stackLen > this.stack.length ) {  // probably user pressed "Forward" button
          const howMany = this.stack.length - event.state.stackLen
          console.debug('rejecting popstate b/c target stackLen',event.state.stackLen,'> stack.length',this.stack.length,'so go',howMany)
          history.go(howMany)
        }
        else { // event.state.stackLen < this.stack.length
          const popHowMany = this.stack.length - event.state.stackLen
          paranoia(popHowMany>0)
          console.debug('popstate target stackLen',event.state.stackLen,'< stack.length',this.stack.length,'so need to pop',popHowMany,'editors')
          for ( let i=0; i<popHowMany; i++ ) {
            assert(this.stack.length>1)
            const top = this.top
            if (await top.requestClose())
              await this.pop(top)
            else {
              /* The editor did not want to close (b/c there were warnings, validation errors,
               * or the user canceled), so we need to reject the history for that many editors. */
              console.debug('editor idx',i,'from top of stack rejected, so go',popHowMany-i)
              history.go(popHowMany-i)
              break
            }
          }
        }
      }
      else console.warn('popstate with invalid state',event.state)
    })

    const histState :HistoryState = { stackLen: this.stack.length }
    history.replaceState(histState, '', null)
    history.scrollRestoration = 'manual'
  }
  get top() :StackAble {
    const top = this.stack.at(-1)
    assert(top)
    return top
  }
  push(e :StackAble) {
    console.debug('Stack push', e.style.briefTitle, e.currentName())
    assert(this.stack.length)
    // hide current top element
    const prevTop = this.top
    prevTop.el.classList.add('d-none')
    prevTop.el.dispatchEvent(new CustomStackEvent({ action: 'hidden', other: e }))
    // push and display new element
    const newLen = this.stack.push(e)
    this.el.appendChild(e.el)
    this.redrawNavbar()
    // save history state
    const histState :HistoryState = { stackLen: newLen }
    history.pushState(histState, '', null)
    // track changes in the new editor
    e.el.addEventListener(CustomChangeEvent.NAME, () => this.restyleNavbar())
    this.initNextButton(e)
    e.shown(true)
    e.el.dispatchEvent(new CustomStackEvent({ action: 'opened' }))
  }
  /** To be called by an editor when it wants to close.
   *
   * @param e The editor itself.
   */
  back(e :StackAble) {
    console.debug('Editor requested its pop', e.style.briefTitle, e.currentName())
    paranoia(this.stack.length>1 && this.top.el===e.el)  // make sure it's the top editor
    history.go(-1)  // handled by popstate event
  }
  private async pop(e :StackAble) {
    console.debug('Stack pop', e.style.briefTitle, e.currentName())
    assert(this.stack.length>1)
    // pop and remove the top element
    const del = this.stack.pop()
    assert(del)
    paranoia(del.el===e.el, `Should have popped ${e.style.briefTitle}/${e.currentName()} but TOS was ${del.style.briefTitle}/${del.currentName()}`)
    await del.close()
    del.el.dispatchEvent(new CustomStackEvent({ action: 'closed' }))
    this.el.removeChild(del.el)
    /* display the element underneath - note it makes sense to always do this, even when popping multiple elements from the stack,
     * because when popping multiple elements, we don't yet know at which element the popping might stop due to a rejected close. */
    const top = this.top
    top.el.classList.remove('d-none')
    this.redrawNavbar()
    top.shown(false)
    top.el.dispatchEvent(new CustomStackEvent({ action: 'shown', other: del }))
  }

  /** Initialize the Next button if provided by this Editor, which gets shown when this Editor has a child Editor on top of it.
   *
   * NOTE: Call me before `Editor.shown()` because I change the footer height, which needs to happen before `doScroll` (`ctx.scrollTo`).
   */
  private initNextButton(ed :StackAble) {

    /** This variable controls whether the next time this editor is shown, its `doNext` is called.
     *
     * The only way to pop an editor is via the history, which doesn't allow passing any extra parameters.
     * So the actions taken under the hood here are:
     * 1. We call `Editor.doSaveAndClose()` here, which, upon successful save, calls `Stack.back()`, and we then also set this flag variable
     * 2. `Stack.back()` calls `history.go(-1)`, causes the browser to fire a `popstate` event
     * 3. The `popstate` handler in this class does `Editor.requestClose()` - which should always succeed since we just saved - and then `Stack.pop()`
     * 4. `Stack.pop()` fires a `CustomStackEvent` of type `shown`, which we handle below,
     *    and if this flag variable is set, we call `Editor.doNext()`.
     *
     * See GH issue #35: Are there conditions under which the above chain can be interrupted and `nextDoNext` needs to be reset?
     */
    let nextDoNext = false
    const sliderNext = new Slider('', async () => {
      assert(Object.is(ed, this.stack.at(-2)))  // make sure the stack looks like we expect it to
      if (await this.top.doSaveAndClose()) nextDoNext = true
    })
    const theEl = <div class="d-flex justify-content-center pt-1 pb-3 px-4 d-none">{sliderNext.el}</div>

    let thisEditorHasChild = false
    let thisEditorsChildIsVisible = false
    const updSliderVis = () => {
      const nextBtnTxt = ed.nextButtonText()
      const show :boolean = !!(thisEditorHasChild && thisEditorsChildIsVisible && nextBtnTxt)
      theEl.classList.toggle('d-none', !show)
      if (show && nextBtnTxt) sliderNext.setText(nextBtnTxt)
      return show
    }

    ed.el.addEventListener(CustomStackEvent.NAME, async evt1 => {
      if (!(evt1 instanceof CustomStackEvent)) return
      switch(evt1.detail.action) {
        case 'opened':
          thisEditorHasChild = false
          this.footer.appendChild(theEl)
          break
        case 'closed':
          await sliderNext.close()
          thisEditorHasChild = false
          this.footer.removeChild(theEl)
          break
        case 'hidden': {  // this editor was hidden by another editor on top of it
          thisEditorHasChild = true
          const childEd = evt1.detail.other
          const updSliderColor = async () => {
            if (!updSliderVis()) return
            const [valid, detail] = await childEd.checkValidity(false, true)
            sliderNext.setToolTip(detail)
            switch (valid) {
              case 'error': sliderNext.setColor('danger'); break
              case 'warn': sliderNext.setColor('warning'); break
              case 'good': sliderNext.setColor('success'); break
            }
          }
          childEd.el.addEventListener(CustomChangeEvent.NAME, updSliderColor)
          childEd.el.addEventListener(CustomStackEvent.NAME, evt2 => {
            if (!(evt2 instanceof CustomStackEvent)) return
            switch (evt2.detail.action) {
              case 'closed':
              case 'hidden':
                thisEditorsChildIsVisible = false
                break
              case 'opened':
              case 'shown':
                thisEditorsChildIsVisible = true
                break
            }
            return updSliderColor()
          })
          break
        }
        case 'shown':  // this editor was revealed after the editor on top of it was closed
          thisEditorHasChild = false
          updSliderVis()
          if (nextDoNext) await ed.doNext()
          break
      }
      nextDoNext = false
    })
  }

}
