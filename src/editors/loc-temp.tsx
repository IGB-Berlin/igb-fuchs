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
import { AbstractStore } from '../storage'
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
  protected override readonly liveObj :SamplingLocationTemplate
  protected override onClose :()=>void = ()=>{}

  constructor(stack :EditorStack, targetStore :AbstractStore<SamplingLocationTemplate>, targetObj :SamplingLocationTemplate|null, args_ ?:object) {
    super(stack, targetStore, targetObj)
    const args :LocationTemplateEditorArgs = isLocationTemplateEditorArgs(args_) ? args_ : { showSampleList: true }
    this.initObj = this.savedObj ? this.savedObj : new SamplingLocationTemplate(null)
    this.liveObj = new SamplingLocationTemplate({
      name: this.initObj.name, description: this.initObj.description,
      nominalCoords: this.initObj.nomCoords.deepClone(),
      samples: this.initObj.samples })

    const inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={this.liveObj.name} />)
    inpName.addEventListener('change', () => this.liveObj.name = inpName.value )
    const inpNomCoords = makeCoordinateEditor(this.liveObj.nomCoords)
    const inpDesc = safeCastElement(HTMLTextAreaElement,
      <textarea rows="3">{this.liveObj.description.trim()}</textarea>)
    inpDesc.addEventListener('change', () => this.liveObj.description = inpDesc.value.trim())
    if (args.showSampleList) {
      //TODO: samples[]
    }

    this.el = this.form = this.makeForm(tr('Sampling Location Template'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), tr('desc-help'), null),
      this.makeRow(inpNomCoords, tr('nom-coord'), tr('nom-coord-help'), null)
    ])

    this.open()
  }
}
