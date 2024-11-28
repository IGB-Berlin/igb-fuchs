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
import { DataObjectBase } from '../types/common'
import { HomePage } from './home'
import { assert } from '../utils'
import { jsx } from '../jsx-dom'
import { Editor } from './base'
import { tr } from '../i18n'

//TODO: The whole stack with all editors needs to be serializable in order to restore state in case the page is closed

export class EditorStack {
  readonly el :HTMLElement
  protected readonly navList :HTMLElement
  protected readonly stack :[string, HTMLElement][]
  constructor(navbarMain :HTMLElement) {
    const home = new HomePage(this)
    this.el = <div>{home.el}</div>
    this.stack = [[tr('Home'),home.el]]
    this.navList = <div class="navbar-nav"></div>
    navbarMain.replaceChildren(this.navList)
    this.redrawNavbar()
  }
  protected redrawNavbar() {
    this.navList.replaceChildren(
      ...this.stack.map(([t,_e],i) => {
        return i<this.stack.length-1
          //TODO: Clicking on a previous item should cancel all editors up to this point (?)
          ? <a class="nav-link" href="#" onclick={(event :Event)=>event.preventDefault()}>{t}</a>
          : <a class="nav-link active" aria-current="page" href="#" onclick={(event :Event)=>event.preventDefault()}>{t}</a>
      }) )
  }
  push<E extends Editor<E, B>, B extends DataObjectBase<B>>(e :E) {
    assert(this.stack.length)
    const top = this.stack.at(-1)
    assert(top)
    top[1].classList.add('d-none')
    this.stack.push([e.briefTitle, e.el])
    this.el.appendChild(e.el)
    this.redrawNavbar()
  }
  pop<E extends Editor<E, B>, B extends DataObjectBase<B>>(e :E) {
    assert(this.stack.length>1)
    const del = this.stack.pop()
    assert(del)
    assert(del[1]===e.el)
    this.el.removeChild(del[1])
    const top = this.stack.at(-1)
    assert(top)
    top[1].classList.remove('d-none')
    this.redrawNavbar()
  }
}
