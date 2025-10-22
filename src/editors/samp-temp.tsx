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
import { isSampleType, SampleTemplate, sampleTypes } from '../types/sample'
import { ListEditorForTemp, SelectedItemContainer } from './list-edit'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { AbstractStore, ArrayStore } from '../storage'
import { MeasurementType } from '../types/measurement'
import { Editor, EditorParent } from './base'
import { MeasTypeEditor } from './meas-type'
import { setRemove } from '../types/set'
import { i18n, tr } from '../i18n'

export class SampleTemplateEditor extends Editor<SampleTemplate> {
  private readonly inpType
  private readonly inpDesc
  private readonly inpInst
  private readonly measEdit
  private readonly selItem :SelectedItemContainer = { el: null }
  constructor(parent :EditorParent, targetStore :AbstractStore<SampleTemplate>, targetObj :SampleTemplate|null, isNew :boolean) {
    super(parent, targetStore, targetObj, isNew)

    this.inpType = safeCastElement(HTMLSelectElement,
      <select class="form-select fw-semibold">
        {sampleTypes.map(t => {
          // NOTE the following i18n.t call removes type safety
          const opt = <option value={t}>{i18n.t('st-'+t, {defaultValue:t}) + (t==='other'?` - ${tr('specify-in-desc')}!`:'')}</option>
          if (this.initObj.type===t) opt.setAttribute('selected','selected')
          return opt
        })}
      </select>)

    this.inpDesc = safeCastElement(HTMLInputElement, <input type="text" value={this.initObj.shortDesc.trim()}></input>)
    const [rowInst, inpInst] = this.makeTextAreaRow(this.initObj.instructions, {
      label: tr('Instructions'), helpText: <>{tr('samp-inst-temp-help')} {tr('inst-help')}</>, startExpanded: this.isNew })
    this.inpInst = inpInst

    this.measEdit = new ListEditorForTemp(this, new ArrayStore(this.initObj.measurementTypes), MeasTypeEditor, MeasurementType.sStyle,
      this.selItem, {title:tr('Measurement Types')}, tr('new-meas-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allMeasurementTemplates, this.initObj.measurementTypes)))

    this.setFormContents([
      this.makeRow(this.inpType, { label: tr('Sample Type'), helpText: <><strong>{tr('Required')}.</strong></> }),
      this.makeRow(this.inpDesc, { label: tr('Short Description'), helpText: <>{tr('samp-short-desc-help')}</> }),
      rowInst,
      this.measEdit.elWithTitle,
    ])
  }
  override async initialize() {
    await this.measEdit.initialize()
    await this.initDone()
    return this
  }

  protected override newObj() { return new SampleTemplate(null) }

  protected override form2obj() {
    return new SampleTemplate({
      type: isSampleType(this.inpType.value) ? this.inpType.value : 'undefined',
      shortDesc: this.inpDesc.value.trim(),
      instructions: this.inpInst.value.trim(), measurementTypes: this.initObj.measurementTypes })
  }

  override currentName(short :boolean) {
    return i18n.t((short?'sts-':'st-')+this.inpType.value, { defaultValue: this.inpType.value })
      + ( this.inpDesc.value.trim().length ? ' / '+this.inpDesc.value.trim() : '' )
  }

  protected override doScroll(pushNotPop :boolean) {
    this.ctx.scrollTo( this.isNew && pushNotPop || !isSampleType(this.inpType.value) || this.inpType.value === 'undefined' ? this.inpType
      : this.inpType.value === 'other' && !this.inpDesc.value.trim().length ? this.inpDesc
        : ( this.selItem.el ?? this.btnSaveClose ) )
  }

}