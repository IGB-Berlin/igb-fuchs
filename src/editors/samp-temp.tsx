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
import { isSampleType, SampleTemplate, sampleTypes } from '../types/sample'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { AbstractStore, ArrayStore } from '../storage'
import { ListEditorForTemp } from './list-edit'
import { Editor, EditorParent } from './base'
import { MeasTypeEditor } from './meas-type'
import { setRemove } from '../types/set'
import { i18n, tr } from '../i18n'

export class SampleTemplateEditor extends Editor<SampleTemplate> {
  private readonly inpType
  private readonly inpDesc
  private readonly inpInst
  private readonly measEdit
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
    this.inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{this.initObj.instructions.trim()}</textarea>)

    this.measEdit = new ListEditorForTemp(this, new ArrayStore(this.initObj.measurementTypes), MeasTypeEditor, null,
      {title:tr('Measurements')}, tr('new-meas-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allMeasurementTemplates, this.initObj.measurementTypes)))

    this.initialize([
      this.makeRow(this.inpType, tr('Sample Type'), <><strong>{tr('Required')}.</strong></>, null),
      this.makeRow(this.inpDesc, tr('Short Description'), <>{tr('samp-short-desc-help')}</>, null),
      this.makeRow(this.inpInst, tr('Instructions'), <>{tr('samp-inst-temp-help')} {tr('inst-help')}</>, null),
      this.measEdit.elWithTitle,
    ])
  }

  protected override newObj() { return new SampleTemplate(null) }

  protected override form2obj() {
    return new SampleTemplate({
      type: isSampleType(this.inpType.value) ? this.inpType.value : 'undefined',
      shortDesc: this.inpDesc.value.trim(),
      instructions: this.inpInst.value.trim(), measurementTypes: this.initObj.measurementTypes })
  }

  override currentName() {
    return i18n.t('st-'+this.inpType.value, { defaultValue: this.inpType.value })
      + ( this.inpDesc.value.trim().length ? ' / '+this.inpDesc.value.trim() : '' )
  }

  protected override doScroll() {
    this.ctx.scrollTo( this.isNew || !isSampleType(this.inpType.value) || this.inpType.value === 'undefined' ? this.inpType
      : this.inpType.value === 'other' && !this.inpDesc.value.trim().length ? this.inpDesc
        : this.measEdit.el )  //TODO: scroll to last selected item, if any
  }

}