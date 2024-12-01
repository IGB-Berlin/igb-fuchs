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
import { ListEditorForTemp } from './list-edit'
import { VALID_NAME_RE } from '../types/common'
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

    /* We want to edit the original object's arrays directly, because we want changes there to be saved
     * immediately. So it's important that we propagate the change event to the parent via `reportMod` below.
     * In addition, it's important we:
     * - Enable the ListEditor to watch this editor so that it enables itself when appropriate (`watchEnable`)
     * - Call the ListEditor's `close` (below) so that it can clean up (e.g. removing event listeners).
     */
    const locStore = new ArrayStore(obj.locations)
    const locEdit = new ListEditorForTemp(ctx, locStore, LocationTemplateEditor, tr('new-loc-from-temp'),
      ()=>Promise.resolve(setRemove(ctx.storage.allLocationTemplates, obj.locations.map(l => l.cloneNoSamples()))))
    locStore.events.add(() => this.reportMod())
    locEdit.watchEnable(this)

    const sampStore = new ArrayStore(obj.commonSamples)
    const sampEdit = new ListEditorForTemp(ctx, sampStore, SampleTemplateEditor, tr('new-samp-from-temp'),
      ()=>Promise.resolve(setRemove(ctx.storage.allSampleTemplates, obj.commonSamples)))
    sampStore.events.add(() => this.reportMod())
    sampEdit.watchEnable(this)

    this.onClose = () => { locEdit.close(); sampEdit.close() }

    this.el = this.form = this.makeForm(tr('Sampling Trip Template'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), tr('trip-desc-help'), null),
      locEdit.withBorder(tr('Sampling Locations')),
      sampEdit.withBorder(tr('common-samples'), tr('common-samples-help')),
    ])

    this.form2obj = () => new SamplingTripTemplate({ id: obj.id,
      name: inpName.value, description: inpDesc.value.trim(),
      locations: obj.locations, commonSamples: obj.commonSamples })

    this.open()
  }

}