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
//import * as bootstrap from 'bootstrap'
//import * as location from './location'
import { assert } from './utils'
//import * as share from './share'
import { jsx } from './jsx-dom'
import { tr } from './i18n'
/*import { MeasTypeEditor } from './editors/meas-type'
import { ListEditor } from './editors/list-edit'
import { MeasurementType } from './types/meas-type'*/
import { HomePage } from './editors/home'

export async function init() {
  const htmlMain = document.querySelector('main')
  const navbarMain = document.getElementById('navbarMain')
  assert(htmlMain instanceof HTMLElement && navbarMain instanceof HTMLDivElement)

  navbarMain.appendChild(<div class="navbar-nav">
    <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#aboutDialog" onclick={(e:Event)=>e.preventDefault()}>{tr('About')}</a>
  </div>)

  const home = new HomePage()
  htmlMain.appendChild(home.el)

  /*htmlMain.appendChild( new ListEditor([
    new MeasurementType({ name:'Hello', unit:'cm' }), new MeasurementType({ name:'World', unit:'ml' })
  ], MeasTypeEditor).el )*/
}

/*export async function test() {
  await location.query()
  //location.start()
  dummy.appendChild(<button onclick={async () => await share.shareCsv('test.csv', new ArrayBuffer(0))}>Share Test</button>)
  dummy.appendChild(<button onclick={async () => await share.downloadCsv('test.csv', new ArrayBuffer(0))}>Download</button>)
}*/
