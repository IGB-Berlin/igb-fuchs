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
import { listSelectDialog } from './list-dialog'

export class TripTemplateEditor extends Editor<TripTemplateEditor, SamplingTripTemplate> {
  static override readonly briefTitle: string = tr('trip-temp')
  override readonly el :HTMLElement
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<SamplingTripTemplate>
  protected override form2obj :()=>Readonly<SamplingTripTemplate>

  constructor(stack :EditorStack, targetArray :SamplingTripTemplate[], idx :number) {
    super(stack, targetArray, idx)
    const obj = this.initObj = this.savedObj ? this.savedObj : new SamplingTripTemplate(null)

    const inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpDesc = safeCastElement(HTMLTextAreaElement,
      <textarea rows="3">{obj.description.trim()}</textarea>)
    const locArgs :LocationTemplateEditorArgs = { showSampleList: true }

    const locEdit = new ListEditor(stack, obj.locations, LocationTemplateEditor, locArgs)
    // Propagate change events to parents - important because we need to trigger a save!
    locEdit.events.add(event => {
      console.debug('TripTemplateEditor got ListEditor<LocationTemplateEditor> event', event.kind)
      this.events.fire({ type: 'save' })
    })
    // "New from Template" - TODO: add button to list editor?
    const btnLocFromTemp = <button type="button" class="btn btn-info" disabled><i class="bi-journal-plus"/> {tr('From Template')}</button>
    btnLocFromTemp.addEventListener('click', async () => {
      //TODO: fetch the list of templates and use it here (and filter locations already in our list)
      const idx = await listSelectDialog(tr('new-loc-from-temp'), obj.locations)
      console.debug('selected', idx)  //TODO: debug, remove
    })
    /* If this is a new object we are currently editing, it won't have been saved to its
     * target array, so any changes to any arrays it holds (like in this case the .locations[])
     * won't be saved either. So, to prevent users from being able to build large object
     * trees without them ever being saved, we require this current object to be saved
     * before allowing edits to its arrays.
     */
    const updState = () => {
      locEdit.updateEnable(!!this.savedObj)
      if (this.savedObj)
        btnLocFromTemp.removeAttribute('disabled')
      else
        btnLocFromTemp.setAttribute('disabled', 'disabled')
    }
    updState()
    this.events.add(event => { if (event.type==='save') updState() })

    //TODO: commonSamples[]

    this.el = this.form = this.makeForm(tr('Sampling Trip Template'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), tr('desc-help'), null),
      <div class="border rounded my-3 p-3">
        <div class="mb-3 fs-5">{tr('Sampling Location Templates')}</div>
        {btnLocFromTemp}
        {locEdit.el}
      </div>,
    ])

    this.form2obj = () => new SamplingTripTemplate({ name: inpName.value, description: inpDesc.value.trim(),
      locations: obj.locations, commonSamples: [] })

    this.open()
  }

}