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
import { makeCoordinateEditor } from './coords'
import { VALID_NAME_RE } from '../types/common'
import { EventList } from '../types/list'
import { EditorStack } from './stack'
import { Editor } from './base'
import { tr } from '../i18n'

export interface LocationTemplateEditorArgs {
  showSampleList :boolean
}
function isLocationTemplateEditorArgs(o :unknown) :o is LocationTemplateEditorArgs {
  return !!( o && typeof o === 'object' && 'showSampleList' in o && typeof o.showSampleList === 'boolean' )
}

export class LocationTemplateEditor extends Editor<LocationTemplateEditor, SamplingLocationTemplate> {
  static override readonly briefTitle = tr('loc-temp')
  override readonly el :HTMLElement
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<SamplingLocationTemplate>
  protected override form2obj: ()=>Readonly<SamplingLocationTemplate>
  protected override onClose :()=>void = ()=>{}

  constructor(stack :EditorStack, targetList :EventList<SamplingLocationTemplate>, targetIdx :number, args_ ?:object) {
    super(stack, targetList, targetIdx)
    const obj = this.initObj = this.savedObj ? this.savedObj : new SamplingLocationTemplate(null)
    const args :LocationTemplateEditorArgs = isLocationTemplateEditorArgs(args_) ? args_ : { showSampleList: true }

    const inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const nomCoords = obj.nomCoords.deepClone().toJSON('')  // don't modify the original object directly!
    const inpNomCoords = makeCoordinateEditor(nomCoords)
    const inpDesc = safeCastElement(HTMLTextAreaElement,
      <textarea rows="3">{obj.description.trim()}</textarea>)
    if (args.showSampleList) {
      //TODO: samples[]
    }

    this.el = this.form = this.makeForm(tr('Sampling Location Template'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), tr('desc-help'), null),
      this.makeRow(inpNomCoords, tr('nom-coord'), tr('nom-coord-help'), null)
    ])

    this.form2obj = () =>
      new SamplingLocationTemplate({ name: inpName.value,
        description: inpDesc.value.trim(), nominalCoords: nomCoords,
        samples: [] })

    this.open()
  }
}
