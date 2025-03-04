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
import { jsx, safeCastElement } from './jsx-dom'
import { globalHideHelp } from './help'
import { GlobalContext } from './main'
import { tr } from './i18n'

export async function makeSettings(ctx :GlobalContext) :Promise<HTMLElement> {
  const inpHideHelp = safeCastElement(HTMLInputElement,
    <input class="form-check-input" type="checkbox" role="switch" id="cbHideHelp"/>)
  inpHideHelp.addEventListener('change', async () => {
    await ctx.storage.settings.set('hideHelpTexts', inpHideHelp.checked)
    globalHideHelp(inpHideHelp.checked)
  })
  if (await ctx.storage.settings.get('hideHelpTexts')) {
    inpHideHelp.checked = true
    globalHideHelp(true)
  }
  return <div class="p-2">
    <div class="form-check form-switch">
      {inpHideHelp}
      <label class="form-check-label" for="cbHideHelp">{tr('hide-help-texts')}</label>
    </div>
  </div>
}
