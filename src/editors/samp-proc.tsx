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
import { SamplingLocationTemplate } from '../types/location'
import { AbstractStore, ArrayStore } from '../storage'
import { SamplingProcedure } from '../types/sampling'
import { LocationTemplateEditor } from './loc-temp'
import { SampleTemplateEditor } from './samp-temp'
import { SampleTemplate } from '../types/sample'
import { VALID_NAME_RE } from '../types/common'
import { Editor, EditorParent } from './base'
import { setRemove } from '../types/set'
import { tr } from '../i18n'

export class SamplingProcedureEditor extends Editor<SamplingProcedure> {
  private readonly inpName
  private readonly inpCheck
  private readonly inpInst
  private readonly sampEdit
  private readonly locEdit
  private readonly selItem :SelectedItemContainer = { el: null }
  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingProcedure>, targetObj :SamplingProcedure|null, isNew :boolean) {
    super(parent, targetStore, targetObj, isNew)

    this.inpName = safeCastElement(HTMLInputElement,
      <input type="text" class="fw-semibold" required pattern={VALID_NAME_RE.source} value={this.initObj.name} />)
    const [rowCheck, inpCheck] = this.makeTextAreaRow(this.initObj.checklist.join('\n'), {
      label: tr('Checklist'), helpText: <>{tr('checklist-temp-help')}</>, startExpanded: this.isNew })
    this.inpCheck = inpCheck
    const [rowInst, inpInst] = this.makeTextAreaRow(this.initObj.instructions, {
      label: tr('Instructions'), helpText: <>{tr('proc-inst-temp-help')} {tr('inst-help')}</>, startExpanded: this.isNew })
    this.inpInst = inpInst

    this.sampEdit = new ListEditorForTemp(this, new ArrayStore(this.initObj.commonSamples), SampleTemplateEditor, SampleTemplate.sStyle,
      this.selItem, {title:tr('common-samples'), help:tr('common-samples-help')}, tr('new-samp-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allSampleTemplates, this.initObj.commonSamples)))

    this.locEdit = new ListEditorForTemp(this, new ArrayStore(this.initObj.locations), LocationTemplateEditor, SamplingLocationTemplate.sStyle,
      this.selItem, {title:tr('Sampling Locations')}, tr('new-loc-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allLocationTemplates, this.initObj.locations.map(l => l.cloneNoSamples()))))

    this.setFormContents([
      this.makeRow(this.inpName, { label: tr('Name'),
        helpText: <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, invalidText: tr('Invalid name') }),
      rowCheck,
      rowInst,
      this.sampEdit.elWithTitle,
      this.locEdit.elWithTitle,
    ])
  }
  override async initialize() {
    await this.sampEdit.initialize()
    await this.locEdit.initialize()
    await this.initDone()
    return this
  }

  protected override newObj() { return new SamplingProcedure(null) }

  protected override form2obj() {
    return new SamplingProcedure({ id: this.initObj.id,
      name: this.inpName.value, instructions: this.inpInst.value.trim(),
      checklist: this.inpCheck.value.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length),
      locations: this.initObj.locations, commonSamples: this.initObj.commonSamples })
  }

  override currentName() { return this.inpName.value }

  protected override doScroll(pushNotPop :boolean) {
    this.ctx.scrollTo( this.isNew && pushNotPop || !this.inpName.value.trim().length ? this.inpName
      : ( this.selItem.el ?? (
        this.initObj.commonSamples.length ? this.btnSaveClose : this.locEdit.titleEl
      ) ) )
  }

}