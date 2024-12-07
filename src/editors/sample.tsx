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
import { isSampleType, Sample, sampleTypes } from '../types/sample'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { AbstractStore, ArrayStore } from '../storage'
import { ListEditorWithTemp } from './list-edit'
import { Editor, EditorParent } from './base'
import { MeasurementEditor } from './meas'
import { setRemove } from '../types/set'
import { i18n, tr } from '../i18n'

export class SampleEditor extends Editor<SampleEditor, Sample> {
  protected override readonly form2obj :()=>Readonly<Sample>
  protected override newObj() { return new Sample(null) }

  constructor(parent :EditorParent, targetStore :AbstractStore<Sample>, targetObj :Sample|null) {
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

    const inpDesc = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly>{obj.template?.description.trim()??''}</textarea>)
    const inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.notes.trim()}</textarea>)

    // see notes in trip-temp.tsx about this:
    const measStore = new ArrayStore(obj.measurements)
    const template = obj.template
    const measEdit = new ListEditorWithTemp(this, measStore, MeasurementEditor, tr('new-meas-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allMeasurementTemplates, obj.measurements.map(m => m.extractTemplate()))),
      template ? ()=>Promise.resolve(setRemove(template.measurementTypes, obj.measurements.map(m => m.extractTemplate()))) : null )

    this.form2obj = () => new Sample({ template: obj.template,
      type: isSampleType(inpType.value) ? inpType.value : 'undefined',
      notes: inpNotes.value.trim(), measurements: obj.measurements })

    this.initialize([
      this.makeRow(inpType, tr('Sample Type'), <><strong>{tr('Required')}.</strong></>, null),
      this.makeRow(inpDesc, tr('Description'), <>{tr('samp-desc-help')} {tr('desc-help')} {tr('desc-see-notes')}</>, null),
      this.makeRow(inpNotes, tr('Notes'), <>{tr('samp-notes-help')} {tr('notes-help')}</>, null),
      measEdit.withBorder(tr('Measurements')),
    ])
  }
}