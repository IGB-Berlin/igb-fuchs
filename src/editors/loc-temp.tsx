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
import { areWgs84CoordsValid } from '../types/coords'
import { SampleTemplateEditor } from './samp-temp'
import { makeCoordinateEditor } from './coords'
import { VALID_NAME_RE } from '../types/common'
import { Editor, EditorParent } from './base'
import { setRemove } from '../types/set'
import { tr } from '../i18n'

export class LocationTemplateEditor extends Editor<SamplingLocationTemplate> {
  private readonly inpName
  private readonly inpDesc
  private readonly inpTasks
  private readonly inpInst
  private readonly nomCoords
  private readonly inpNomCoords
  private readonly sampEdit
  private readonly selItem :SelectedItemContainer = { el: null }
  constructor(parent :EditorParent, targetStore :AbstractStore<SamplingLocationTemplate>, targetObj :SamplingLocationTemplate|null, isNew :boolean) {
    super(parent, targetStore, targetObj, isNew)

    this.inpName = safeCastElement(HTMLInputElement, <input type="text" class="fw-semibold" required pattern={VALID_NAME_RE.source} value={this.initObj.name} />)
    this.inpDesc = safeCastElement(HTMLInputElement, <input type="text" value={this.initObj.shortDesc.trim()}></input>)
    this.inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{this.initObj.instructions.trim()}</textarea>)
    this.nomCoords = this.initObj.nomCoords.deepClone()  // don't modify the original object directly!
    this.inpNomCoords = makeCoordinateEditor(this.nomCoords, false)
    this.inpTasks = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{this.initObj.tasklist.join('\n')}</textarea>)

    const sampStore = new ArrayStore(this.initObj.samples)
    this.sampEdit = new ListEditorForTemp(this, sampStore, SampleTemplateEditor, this.selItem,
      {title:tr('Samples')}, tr('new-samp-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allSampleTemplates, this.initObj.samples)))

    this.initialize([
      this.makeRow(this.inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(this.inpDesc, tr('Short Description'), <>{tr('loc-short-desc-help')}</>, null),
      this.makeRow(this.inpInst, tr('Instructions'), <>{tr('loc-inst-temp-help')} {tr('inst-help')}</>, null),
      this.makeRow(this.inpNomCoords, tr('nom-coord'), <><strong>{tr('Required')}.</strong> {tr('nom-coord-help')} {tr('coord-help')} {tr('dot-minus-hack')} {tr('coord-ref')}</>,
        tr('invalid-coords')),
      this.makeRow(this.inpTasks, tr('Task List'), <>{tr('tasklist-temp-help')}</>, null),
      this.sampEdit.elWithTitle,
    ])
  }

  protected override newObj() { return new SamplingLocationTemplate(null) }

  protected override form2obj() {
    return new SamplingLocationTemplate({ name: this.inpName.value, shortDesc: this.inpDesc.value,
      tasklist: this.inpTasks.value.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length),
      instructions: this.inpInst.value.trim(),  nominalCoords: this.nomCoords.deepClone(),
      samples: this.initObj.samples })
  }

  override currentName() { return this.inpName.value }

  protected override doScroll() {
    this.ctx.scrollTo( this.isNew || !this.inpName.value.trim().length ? this.inpName
      : !areWgs84CoordsValid(this.nomCoords) ? this.inpNomCoords
        : ( this.selItem.el ?? this.btnSaveClose ))
  }

}
