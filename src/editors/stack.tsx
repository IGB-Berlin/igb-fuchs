/** This file is part of IGB-FUCHS.
 *
 * Copyright © 2024 Hauke Dämpfling (haukex@zero-g.net)
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
import { CustomChangeEvent } from '../events'
import { assert, paranoia } from '../utils'
import { jsx } from '../jsx-dom'
import { tr } from '../i18n'

export interface StackAble {  // the only bits of the Editor class we care about
  readonly el :HTMLElement
  readonly briefTitle :string
  readonly fullTitle :string
  readonly unsavedChanges :boolean
  currentName() :string
  requestClose() :Promise<boolean>
  close() :Promise<void>
  shown(pushNotPop :boolean) :void
}

interface HistoryState { stackLen :number }
function isHistoryState(o :unknown) :o is HistoryState {
  return !!( o && typeof o === 'object' && Object.keys(o).length===1 && 'stackLen' in o && typeof o.stackLen === 'number' && o.stackLen>0 ) }

/* TODO Later: Users ask if we can perhaps come up with a color scheme where each type of page
 * has a different color (or color gradient) so that it's easier to identify what object level
 * we're currently on. The nestings are:
 * - Log       -> Location -> Sample -> Meas. -> Type
 * - Procedure -> Location -> Sample          -> Meas. Type
 * - Procedure             -> Sample          -> Meas. Type
 *   Violet?      Blue?       Cyan?     Green?   Yellow? (no, not yellow, that's currently used for unsaved changes)
 * */

export class EditorStack {
  readonly el :HTMLElement = <div class="editor-stack"></div>
  private readonly navList :HTMLElement = <div class="navbar-nav"></div>
  private readonly stack :StackAble[] = []
  private readonly origTitle = document.title
  private redrawNavbar() {
    this.navList.replaceChildren(
      ...this.stack.map((s,i) => {
        const link = <a class="nav-link text-nowrap" href='#'>{s.briefTitle}</a>
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
    let anyUnsaved = false
    Array.from(this.navList.children).forEach((l,i) => {
      assert(l instanceof HTMLAnchorElement)
      const s = this.stack[i]
      assert(s)
      l.classList.toggle('link-warning', s.unsavedChanges)
      l.setAttribute('title', i ? `${s.fullTitle} "${s.currentName()}"` : s.fullTitle)
      l.innerText = i ? `${s.briefTitle} "${s.currentName()}"` : s.briefTitle
      if (s.unsavedChanges) anyUnsaved = true
    })
    // I think the following is a mis-detection by eslint?
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    document.title = this.origTitle + (anyUnsaved?'*':'')
  }
  initialize(navbarMain :HTMLElement, homePage :HTMLElement) {
    assert(this.stack.length===0)
    // note the home page *always* stays on the stack
    this.stack.push({ el: homePage, briefTitle: tr('Home'), fullTitle: tr('Home'), unsavedChanges: false,
      currentName: () => '', requestClose: () => { throw new Error('shouldn\'t happen') },
      close: () => { throw new Error('shouldn\'t happen') }, shown: () => {} })
    this.el.appendChild(homePage)
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
          console.debug('popstate target stackLen',event.state.stackLen,'< stack.length',this.stack.length,'so need to pop',popHowMany,'editors')
          for ( let i=0; i<popHowMany; i++ ) {
            assert(this.stack.length>1)
            const top = this.stack.at(-1)
            assert(top)
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
  push(e :StackAble) {
    console.debug('Stack push', e.briefTitle, e.currentName())
    assert(this.stack.length)
    // hide current top element
    const top = this.stack.at(-1)
    assert(top)
    top.el.classList.add('d-none')
    // push and display new element
    const newLen = this.stack.push(e)
    this.el.appendChild(e.el)
    this.redrawNavbar()
    // save history state
    const histState :HistoryState = { stackLen: newLen }
    history.pushState(histState, '', null)
    // track changes in the new editor
    e.el.addEventListener(CustomChangeEvent.NAME, () => this.restyleNavbar())
    e.shown(true)
  }
  back(e :StackAble) {
    console.debug('Editor requested its pop', e.briefTitle, e.currentName())
    paranoia(this.stack.length>1 && this.stack.at(-1)?.el===e.el)  // make sure it's the top editor
    history.go(-1)  // handled by popstate event
  }
  private async pop(e :StackAble) {
    console.debug('Stack pop', e.briefTitle, e.currentName())
    assert(this.stack.length>1)
    // pop and remove the top element
    const del = this.stack.pop()
    assert(del)
    paranoia(del.el===e.el, `Should have popped ${e.briefTitle}/${e.currentName()} but TOS was ${del.briefTitle}/${del.currentName()}`)
    await del.close()
    this.el.removeChild(del.el)
    /* display the element underneath - note it makes sense to always do this, even when popping multiple elements from the stack,
     * because when popping multiple elements, we don't yet know at which element the popping might stop due to a rejected close. */
    const top = this.stack.at(-1)
    assert(top)
    top.el.classList.remove('d-none')
    this.redrawNavbar()
    top.shown(false)
  }
}
