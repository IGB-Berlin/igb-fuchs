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
import { EditorStack } from './editors/stack'
import { assert } from './utils'

export async function init() {
  const htmlMain = document.querySelector('main')
  const navbarMain = document.getElementById('navbarMain')
  const igbLogo = document.getElementById('igbLogo')
  assert(htmlMain instanceof HTMLElement && navbarMain instanceof HTMLDivElement && igbLogo instanceof HTMLElement)
  igbLogo.addEventListener('click', event => event.preventDefault())
  const editorStack = await EditorStack.makeStack(navbarMain)
  htmlMain.appendChild(editorStack.el)
}

//import * as location from './location'
//import * as share from './share'
/*export async function test() {
  await location.query()
  //location.start()
  dummy.appendChild(<button onclick={async () => await share.shareCsv('test.csv', new ArrayBuffer(0))}>Share Test</button>)
  dummy.appendChild(<button onclick={async () => await share.downloadCsv('test.csv', new ArrayBuffer(0))}>Download</button>)
}*/
