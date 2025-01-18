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
import { ListEditorForTemp, SelectedItemContainer } from './list-edit'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingProcedure } from '../types/sampling'
import { LocationTemplateEditor } from './loc-temp'
import { SampleTemplateEditor } from './samp-temp'
import { VALID_NAME_RE } from '../types/common'
import { Editor, EditorParent } from './base'
import { setRemove } from '../types/set'
import { tr } from '../i18n'

export class SamplingProcedureEditor extends Editor<SamplingProcedureEditor, SamplingProcedure> {
  private readonly inpName
  private readonly inpCheck
  private readonly inpInst
  private readonly sampEdit
  private readonly locEdit
  private readonly selItem :SelectedItemContainer = { el: null }
  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingProcedure>, targetObj :SamplingProcedure|null) {
    super(parent, targetStore, targetObj)

    this.inpName = safeCastElement(HTMLInputElement,
      <input type="text" class="fw-semibold" required pattern={VALID_NAME_RE.source} value={this.initObj.name} />)
    this.inpCheck = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{this.initObj.checklist.join('\n')}</textarea>)
    this.inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{this.initObj.instructions.trim()}</textarea>)

    this.sampEdit = new ListEditorForTemp(this, new ArrayStore(this.initObj.commonSamples), SampleTemplateEditor, this.selItem,
      {title:tr('common-samples'), help:tr('common-samples-help')}, tr('new-samp-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allSampleTemplates, this.initObj.commonSamples)))

    this.locEdit = new ListEditorForTemp(this, new ArrayStore(this.initObj.locations), LocationTemplateEditor, this.selItem,
      {title:tr('Sampling Locations')}, tr('new-loc-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allLocationTemplates, this.initObj.locations.map(l => l.cloneNoSamples()))))

    this.initialize([
      this.makeRow(this.inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(this.inpCheck, tr('Checklist'), <>{tr('checklist-temp-help')}</>, null),
      this.makeRow(this.inpInst, tr('Instructions'), <>{tr('proc-inst-temp-help')} {tr('inst-help')}</>, null),
      this.sampEdit.elWithTitle,
      this.locEdit.elWithTitle,
    ])
  }

  protected override newObj() { return new SamplingProcedure(null) }

  protected override form2obj() {
    return new SamplingProcedure({ id: this.initObj.id,
      name: this.inpName.value, instructions: this.inpInst.value.trim(),
      checklist: this.inpCheck.value.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length),
      locations: this.initObj.locations, commonSamples: this.initObj.commonSamples })
  }

  override currentName() { return this.inpName.value }

  protected override doScroll() {
    this.ctx.scrollTo( this.isBrandNew ? this.inpName : ( this.selItem.el ?? this.locEdit.titleEl ) )
  }

}