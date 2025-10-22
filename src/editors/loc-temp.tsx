/** This file is part of IGB-FUCHS.
 *
 * Copyright © 2024-2025 Hauke Dämpfling (haukex@zero-g.net)
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
import { SampleTemplateEditor } from './samp-temp'
import { SampleTemplate } from '../types/sample'
import { VALID_NAME_RE } from '../types/common'
import { Editor, EditorParent } from './base'
import { CoordinatesEditor } from './coords'
import { setRemove } from '../types/set'
import { tr } from '../i18n'

export class LocationTemplateEditor extends Editor<SamplingLocationTemplate> {
  private readonly inpName
  private readonly inpDesc
  private readonly inpTasks
  private readonly inpInst
  private readonly edNomCoords
  private readonly sampEdit
  private readonly selItem :SelectedItemContainer = { el: null }
  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingLocationTemplate>, targetObj :SamplingLocationTemplate|null, isNew :boolean) {
    super(parent, targetStore, targetObj, isNew)

    this.inpName = safeCastElement(HTMLInputElement, <input type="text" class="fw-semibold" required pattern={VALID_NAME_RE.source} value={this.initObj.name} />)
    this.inpDesc = safeCastElement(HTMLInputElement, <input type="text" value={this.initObj.shortDesc.trim()}></input>)
    const [rowInst, inpInst] = this.makeTextAreaRow(this.initObj.instructions, {
      label: tr('Instructions'), helpText: <>{tr('loc-inst-temp-help')} {tr('inst-help')}</>, startExpanded: this.isNew })
    this.inpInst = inpInst
    this.edNomCoords = new CoordinatesEditor(this.initObj.nomCoords)
    const [rowTasks, inpTasks] = this.makeTextAreaRow(this.initObj.tasklist.join('\n'), {
      label: tr('Task List'), helpText: <>{tr('tasklist-temp-help')}</>, startExpanded: this.isNew })
    this.inpTasks = inpTasks

    const sampStore = new ArrayStore(this.initObj.samples)
    this.sampEdit = new ListEditorForTemp(this, sampStore, SampleTemplateEditor, SampleTemplate.sStyle, this.selItem,
      {title:tr('Samples')}, tr('new-samp-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allSampleTemplates, this.initObj.samples)))

    this.setFormContents([
      this.makeRow(this.inpName, { label: tr('Name'),
        helpText: <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, invalidText: tr('Invalid name') }),
      this.makeRow(this.inpDesc, { label: tr('Short Description'), helpText: <>{tr('loc-short-desc-help')}</> }),
      rowInst,
      this.makeRow(this.edNomCoords.el, { label: tr('nom-coord'), invalidText: tr('invalid-coords'),
        helpText: <><strong>{tr('Required')}.</strong> {tr('nom-coord-help')} {tr('coord-help')} {tr('dot-minus-hack')} {tr('coord-ref')}</> }),
      rowTasks,
      this.sampEdit.elWithTitle,
    ])
  }
  override async initialize() {
    await this.sampEdit.initialize()
    await this.initDone()
    return this
  }

  protected override newObj() { return new SamplingLocationTemplate(null) }

  protected override form2obj() {
    return new SamplingLocationTemplate({ name: this.inpName.value, shortDesc: this.inpDesc.value,
      tasklist: this.inpTasks.value.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length),
      instructions: this.inpInst.value.trim(), nominalCoords: this.edNomCoords.getCoords(),
      samples: this.initObj.samples })
  }

  override currentName() { return this.inpName.value }

  protected override doScroll(pushNotPop :boolean) {
    this.ctx.scrollTo( this.isNew && pushNotPop || !this.inpName.value.trim().length ? this.inpName
      : !this.edNomCoords.isValid() ? this.edNomCoords.el
        : ( this.selItem.el ?? this.btnSaveClose ))
  }

}
