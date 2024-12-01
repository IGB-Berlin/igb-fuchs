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
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingTripTemplate } from '../types/trip'
import { LocationTemplateEditor } from './loc-temp'
import { SampleTemplateEditor } from './samp-temp'
import { listSelectDialog } from './list-dialog'
import { VALID_NAME_RE } from '../types/common'
import { ListEditor } from './list-edit'
import { setRemove } from '../types/set'
import { GlobalContext } from '../main'
import { Editor } from './base'
import { tr } from '../i18n'

export class TripTemplateEditor extends Editor<TripTemplateEditor, SamplingTripTemplate> {
  override readonly el :HTMLElement
  static override readonly briefTitle: string = tr('trip-temp')
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<SamplingTripTemplate>
  protected override readonly form2obj :()=>Readonly<SamplingTripTemplate>
  protected override readonly onClose :()=>void

  constructor(ctx :GlobalContext, targetStore :AbstractStore<SamplingTripTemplate>, targetObj :SamplingTripTemplate|null) {
    super(ctx, targetStore, targetObj)
    const obj = this.initObj = targetObj!==null ? targetObj : new SamplingTripTemplate(null)

    const inpName = safeCastElement(HTMLInputElement,
      <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpDesc = safeCastElement(HTMLTextAreaElement,
      <textarea rows="3">{obj.description.trim()}</textarea>)

    /* We want to edit the original object's locations array directly, because
     * we want changes there to be saved immediately, for that we propagate
     * the change event to the parent via `reportSelfChange` below. */
    const locList = new ArrayStore(obj.locations)
    const locEdit = new ListEditor(ctx, locList, LocationTemplateEditor)
    locList.events.add(() => this.reportMod())

    // "New from Template" - TODO: add button to list editor?
    const btnLocFromTemp = <button type="button" class="btn btn-info" disabled><i class="bi-journal-plus"/> {tr('From Template')}</button>
    btnLocFromTemp.addEventListener('click', async () => {
      const locs = setRemove(ctx.storage.allLocationTemplates, obj.locations.map(l => l.cloneNoSamples()))
      const idx = await listSelectDialog(tr('new-loc-from-temp'), locs)
      console.debug('selected', idx)  //TODO: debug, do something useful instead
    })

    const sampList = new ArrayStore(obj.commonSamples)
    const sampEdit = new ListEditor(ctx, sampList, SampleTemplateEditor)
    sampList.events.add(() => this.reportMod())

    /* If this is a new object we are currently editing, it won't have been saved to its
     * target array, so any changes to any arrays it holds (like in this case the .locations[])
     * won't be saved either. So, to prevent users from being able to build large object
     * trees without them ever being saved, we require this current object to be saved
     * before allowing edits to its arrays. */
    const updState = () => {
      locEdit.enable(!!this.savedObj)
      sampEdit.enable(!!this.savedObj)
      if (this.savedObj) btnLocFromTemp.removeAttribute('disabled')
      else btnLocFromTemp.setAttribute('disabled', 'disabled')
    }
    updState()
    targetStore.events.add(updState)
    this.onClose = () => targetStore.events.remove(updState)

    this.el = this.form = this.makeForm(tr('Sampling Trip Template'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), tr('trip-desc-help'), null),
      <div class="border rounded my-3 p-3">
        <div class="mb-3 fs-5">{tr('Sampling Locations')}</div>
        {btnLocFromTemp}
        {locEdit.el}
      </div>,
      <div class="border rounded my-3 p-3">
        <div class="fs-5">{tr('common-samples')}</div>
        <div class="form-text mb-3">{tr('common-samples-help')}</div>
        {sampEdit.el}
      </div>,
    ])

    this.form2obj = () => new SamplingTripTemplate({ id: obj.id,
      name: inpName.value, description: inpDesc.value.trim(),
      locations: obj.locations, commonSamples: obj.commonSamples })

    this.open()
  }

}