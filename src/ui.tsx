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
import * as bootstrap from 'bootstrap'
import { jsx } from './jsx-dom'
import { i18n } from './i18n'
import * as location from './location'
import * as share from './share'
import { takePicture } from './camera'

export async function test() {
  const dummy = <div><h1>{i18n.t('hello-world')}</h1></div>
  dummy.appendChild(<button onclick={()=>new bootstrap.Modal('#about-dialog').show()}>About</button>)
  await location.query()
  //location.start()
  dummy.appendChild(<button onclick={async () => await share.shareCsv('test.csv', new ArrayBuffer(0))}>Share Test</button>)
  dummy.appendChild(<button onclick={async () => await share.downloadCsv('test.csv', new ArrayBuffer(0))}>Download</button>)
  dummy.appendChild(<button onclick={takePicture}>Take Picture</button>)
  return dummy
}
