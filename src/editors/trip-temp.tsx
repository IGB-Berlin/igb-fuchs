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
import { LocationTemplateEditor, LocationTemplateEditorArgs } from './loc-temp'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { SamplingTripTemplate } from '../types/trip'
import { VALID_NAME_RE } from '../types/common'
import { ListEditor } from './list-edit'
import { EditorStack } from './stack'
import { Editor } from './base'
import { tr } from '../i18n'

export class TripTemplateEditor extends Editor<TripTemplateEditor, SamplingTripTemplate> {
  static override readonly briefTitle: string = tr('trip-temp')
  override readonly el :HTMLElement
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<SamplingTripTemplate>
  protected override form2obj :()=>Readonly<SamplingTripTemplate>

  constructor(stack :EditorStack, targetArray :SamplingTripTemplate[], idx :number) {
    super(stack, targetArray, idx)
    this.initObj = this.savedObj ? this.savedObj.deepClone() : new SamplingTripTemplate(null)

    const inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={this.initObj.name} />)
    const inpDesc = safeCastElement(HTMLTextAreaElement,
      <textarea rows="3">{this.initObj.description.trim()}</textarea>)
    const locArgs :LocationTemplateEditorArgs = { showSampleList: true }

    /* TODO: How to cause list edit events to be propagated to parent and saved?
     * We want changes made in the ListEditor to be saved immediately, and since those
     * edits require the user to click a "Save" button, that makes sense too.
     * However, currently, almost every editor works with object deepClone()s.
     */
    const locations = Array.from(this.initObj.locations)
    const locEdit = new ListEditor(stack, locations, LocationTemplateEditor, locArgs)
    //locEdit.events.add(() => ...)
    //TODO: "New from template" button

    //TODO: commonSamples[]

    this.el = this.form = this.makeForm(tr('Sampling Trip Template'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {tr('name-help')}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), tr('desc-help'), null),
      <div class="border rounded my-3 p-3"> <div class="mb-3 fs-5">{tr('Sampling Location Templates')}</div> {locEdit.el} </div>,
    ])

    this.form2obj = () => new SamplingTripTemplate({ name: inpName.value, description: inpDesc.value.trim(),
      locations: locations, commonSamples: [] })

    this.open()
  }

}