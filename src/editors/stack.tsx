/** IGB-Field
 *
 * Copyright © 2024 Hauke Dämpfling (haukex@zero-g.net)
 * at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
 * Berlin, Germany, <https://www.igb-berlin.de/>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { CUSTOM_CHANGE_EVENT_NAME } from './base'
import { assert } from '../utils'
import { jsx } from '../jsx-dom'
import { tr } from '../i18n'

interface StackAble {  // the only bits of the Editor class we care about
  readonly el :HTMLElement
  readonly briefTitle :string
  readonly unsavedChanges :boolean
}

interface HistoryState { stackLen :number }
function isHistoryState(o :unknown) :o is HistoryState {
  return !!( o && typeof o === 'object' && Object.keys(o).length===1 && 'stackLen' in o && typeof o.stackLen === 'number' && o.stackLen>0 ) }

export class EditorStack {
  readonly el :HTMLElement = <div class="editor-stack"></div>
  protected readonly navList :HTMLElement = <div class="navbar-nav"></div>
  protected readonly stack :StackAble[] = []
  protected redrawNavbar() {
    this.navList.replaceChildren(
      ...this.stack.map((s,i) => {
        const link = <a class="nav-link" href='#'>{s.briefTitle}</a>
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
  }
  initialize(navbarMain :HTMLElement, homePage :HTMLElement) {
    assert(this.stack.length===0)
    this.stack.push({ el: homePage, briefTitle: tr('Home'), unsavedChanges: false })
    this.el.appendChild(homePage)
    navbarMain.replaceChildren(this.navList)
    this.redrawNavbar()

    // https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event
    window.addEventListener('beforeunload', event => {
      /* Instead of looking at .unsavedChanges, we currently want to prevent any navigation while any editor
       * is open, because that will drop the object's .template associations, which is an annoying user
       * experience. I have a note elsewhere that I could think about persisting that, but that's low-priority.
       * For now, the advice to users is to stay on this page for the entire measurement trip. */
      if ( this.stack.length>1 /*this.stack.some(s => s.unsavedChanges*)*/ ) {
        event.preventDefault()
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        event.returnValue = true  // MDN says it's best practice to still do this despite deprecation
        return true
      }
      return undefined
    })

    window.addEventListener('popstate', event => {
      if (isHistoryState(event.state)) {
        const targetStackLen = event.state.stackLen
        if (targetStackLen>=this.stack.length) {  // probably user pressed "Forward" button
          const howMany = this.stack.length - targetStackLen
          console.debug('rejecting popstate b/c targetStackLen',targetStackLen,'> stack.length',this.stack.length,'so go',howMany)
          if (howMany) history.go(howMany)
        }
        else {
          const popHowMany = this.stack.length - targetStackLen
          console.debug('popstate targetStackLen',targetStackLen,'stack.length',this.stack.length,'so need to pop',popHowMany,'editors')
          for (let i=0;i<popHowMany;i++) {
            assert(this.stack.length>1)
            const top = this.stack.at(-1)
            assert(top)
            //TODO: This isn't quite working right when there are unsaved changes.
            if (top.unsavedChanges) {
              const howMany = popHowMany-1-i
              console.debug('popping #',i+1,'unsavedChanges so go',howMany)
              if (howMany) history.go(howMany)
              break
            }
            else {
              console.debug('popping #',i+1)
              this._pop(top)
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
    console.debug('Stack push', e.briefTitle)
    assert(this.stack.length)
    const top = this.stack.at(-1)
    assert(top)
    top.el.classList.add('d-none')
    const newLen = this.stack.push(e)
    this.el.appendChild(e.el)
    this.redrawNavbar()
    //TODO Later: The title is hidden under the sticky header
    e.el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    const histState :HistoryState = { stackLen: newLen }
    history.pushState(histState, '', null)
    e.el.addEventListener(CUSTOM_CHANGE_EVENT_NAME, () => console.debug('Change!', e.briefTitle, e.unsavedChanges))  //TODO: something useful with this
  }
  pop(e :StackAble) {
    console.debug('Programmatic stack pop requested by editor',e.briefTitle)
    assert(this.stack.length>1)
    const top = this.stack.at(-1)
    assert(top && top.el===e.el)
    history.go(-1)  // handled by popstate event
  }
  protected _pop(e :StackAble) {
    console.debug('Stack pop', e.briefTitle)
    assert(this.stack.length>1)
    const del = this.stack.pop()
    assert(del)
    assert(del.el===e.el, `Should have popped ${e.briefTitle} but TOS was ${del.briefTitle}`)  // paranoia
    this.el.removeChild(del.el)
    const top = this.stack.at(-1)
    assert(top)
    top.el.classList.remove('d-none')
    this.redrawNavbar()
    top.el.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
}
