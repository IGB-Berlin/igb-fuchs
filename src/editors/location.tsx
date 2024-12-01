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
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { SamplingLocation } from '../types/location'
import { VALID_NAME_RE } from '../types/common'
import { AbstractStore } from '../storage'
import { GlobalContext } from '../main'
import { Editor } from './base'
import { tr } from '../i18n'

export class SamplingLocationEditor extends Editor<SamplingLocationEditor, SamplingLocation> {
  override readonly el :HTMLElement
  static override readonly briefTitle: string = tr('trip-temp')
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<SamplingLocation>
  protected override readonly form2obj :()=>Readonly<SamplingLocation>
  protected override readonly onClose :()=>void

  constructor(ctx :GlobalContext, targetStore :AbstractStore<SamplingLocation>, targetObj :SamplingLocation|null) {
    super(ctx, targetStore, targetObj)
    const obj = this.initObj = targetObj!==null ? targetObj : new SamplingLocation(null, null)

    const inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    //TODO: description
    //TODO: nominalCoords
    //TODO: actualCoords
    //TODO: startTime
    //TODO: endTime
    //TODO: samples[]
    //TODO: notes
    //TODO: photos

    this.onClose = () => {}

    this.el = this.form = this.makeForm(tr('Sampling Location'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
    ])

    this.form2obj = () => new SamplingLocation(null, null)  //TODO

    this.open()
  }
}