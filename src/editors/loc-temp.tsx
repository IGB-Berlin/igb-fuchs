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
import { SamplingLocationTemplate } from '../types/location'
import { Wgs84Coordinates } from '../types/coords'
import { makeCoordinateEditor } from './coords'
import { VALID_NAME_RE } from '../types/common'
import { AbstractStore } from '../storage'
import { GlobalContext } from '../main'
import { Editor } from './base'
import { tr } from '../i18n'

export class LocationTemplateEditor extends Editor<LocationTemplateEditor, SamplingLocationTemplate> {
  override readonly el :HTMLElement
  static override readonly briefTitle = tr('loc-temp')
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<SamplingLocationTemplate>
  protected override readonly form2obj: ()=>Readonly<SamplingLocationTemplate>
  protected override readonly onClose :()=>void = ()=>{}

  constructor(ctx :GlobalContext, targetStore :AbstractStore<SamplingLocationTemplate>, targetObj :SamplingLocationTemplate|null) {
    super(ctx, targetStore, targetObj)
    const obj = this.initObj = targetObj!==null ? targetObj : new SamplingLocationTemplate(null)

    const inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const nomCoords = obj.nomCoords.deepClone().toJSON('')  // don't modify the original object directly!
    const inpNomCoords = makeCoordinateEditor(nomCoords)
    const inpDesc = safeCastElement(HTMLTextAreaElement,
      <textarea rows="3">{obj.description.trim()}</textarea>)

    //TODO: samples[]

    this.el = this.form = this.makeForm(tr('Sampling Location Template'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), tr('desc-help'), null),
      this.makeRow(inpNomCoords, tr('nom-coord'), tr('nom-coord-help'), null)
    ])

    this.form2obj = () =>
      new SamplingLocationTemplate({ name: inpName.value,
        description: inpDesc.value.trim(),
        nominalCoords: new Wgs84Coordinates(nomCoords).deepClone(),
        samples: [] })

    this.open()
  }
}
