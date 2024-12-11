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

export class SampleTemplateEditor extends Editor<SampleTemplateEditor, SampleTemplate> {
  protected override readonly form2obj :()=>Readonly<SampleTemplate>
  protected override newObj() { return new SampleTemplate(null) }

  constructor(parent :EditorParent, targetStore :AbstractStore<SampleTemplate>, targetObj :SampleTemplate|null) {
    super(parent, targetStore, targetObj)
    const obj = this.initObj

    const inpType = safeCastElement(HTMLSelectElement,
      <select class="form-select">
        {sampleTypes.map(t => {
          // NOTE the following i18n.t call removes type safety
          const opt = <option value={t}>{i18n.t('st-'+t, {defaultValue:t})}</option>
          if (obj.type===t) opt.setAttribute('selected','selected')
          return opt
        })}
      </select>)

    const inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.instructions.trim()}</textarea>)

    // see notes in procedure.tsx about this:
    const measStore = new ArrayStore(obj.measurementTypes)
    const measEdit = new ListEditorForTemp(this, measStore, MeasTypeEditor, tr('new-meas-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allMeasurementTemplates, obj.measurementTypes)))

    this.form2obj = () => new SampleTemplate({
      type: isSampleType(inpType.value) ? inpType.value : 'undefined',
      instructions: inpInst.value.trim(), measurementTypes: obj.measurementTypes })

    this.initialize([
      this.makeRow(inpType, tr('Sample Type'), <><strong>{tr('Required')}.</strong></>, null),
      this.makeRow(inpInst, tr('Instructions'), <>{tr('samp-inst-help')} {tr('inst-help')}</>, null),
      measEdit.withBorder(tr('Measurements')),
    ])
  }

}