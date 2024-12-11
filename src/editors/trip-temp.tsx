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
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingProcedure } from '../types/trip'
import { LocationTemplateEditor } from './loc-temp'
import { SampleTemplateEditor } from './samp-temp'
import { ListEditorForTemp } from './list-edit'
import { VALID_NAME_RE } from '../types/common'
import { Editor, EditorParent } from './base'
import { setRemove } from '../types/set'
import { tr } from '../i18n'
import { makeTextAreaAutoHeight } from '../utils'

export class SamplingProcedureEditor extends Editor<SamplingProcedureEditor, SamplingProcedure> {
  protected override readonly form2obj :()=>Readonly<SamplingProcedure>
  protected override newObj() { return new SamplingProcedure(null) }

  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingProcedure>, targetObj :SamplingProcedure|null) {
    super(parent, targetStore, targetObj)
    const obj = this.initObj

    const inpName = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpDesc = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.description.trim()}</textarea>)
    const inpCheck = safeCastElement(HTMLTextAreaElement, <textarea rows="1">{obj.checklist.join('\n')}</textarea>)
    makeTextAreaAutoHeight(inpCheck)

    /* We want to edit the original object's arrays directly, because we want changes there to be saved
     * immediately. So it's important that we propagate the change event to the parent via `reportMod` below.
     * In addition, it's important we:
     * - Enable the ListEditor to watch this editor so that it enables itself when appropriate (`watchEnable`)
     * - Call the ListEditor's `close` (below) so that it can clean up (e.g. removing event listeners).
     */
    const locStore = new ArrayStore(obj.locations)
    const locEdit = new ListEditorForTemp(this, locStore, LocationTemplateEditor, tr('new-loc-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allLocationTemplates, obj.locations.map(l => l.cloneNoSamples()))))

    const sampStore = new ArrayStore(obj.commonSamples)
    const sampEdit = new ListEditorForTemp(this, sampStore, SampleTemplateEditor, tr('new-samp-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allSampleTemplates, obj.commonSamples)))

    this.form2obj = () => new SamplingProcedure({ id: obj.id,
      name: inpName.value, description: inpDesc.value.trim(),
      checklist: inpCheck.value.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length),
      locations: obj.locations, commonSamples: obj.commonSamples })

    this.initialize([
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), <>{tr('proc-desc-help')} {tr('desc-help')}</>, null),
      this.makeRow(inpCheck, tr('Checklist'), <>{tr('checklist-temp-help')}</>, null),
      sampEdit.withBorder(tr('common-samples'), tr('common-samples-help')),
      locEdit.withBorder(tr('Sampling Locations')),
    ])
  }

}