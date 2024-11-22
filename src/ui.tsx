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
import { jsx } from './jsx-dom'
import { Dict, I18n } from 'i18n-js'
import * as translations from './translations.json'

// https://fnando.github.io/i18n/
const i18n = new I18n(translations as Dict,
  { defaultLocale: 'en-US', missingBehavior: 'error', locale: navigator.language })

export function test() {
  //const aboutModal = new bootstrap.Modal('#about-dialog')
  //aboutModal.show()
  return <h1>{i18n.t('hello-world')}</h1>
}
