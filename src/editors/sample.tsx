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
import { isSampleType, Sample, sampleTypes } from '../types/sample'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { AbstractStore } from '../storage'
import { GlobalContext } from '../main'
import { i18n, tr } from '../i18n'
import { Editor } from './base'

export class SampleEditor extends Editor<SampleEditor, Sample> {
  override readonly el :HTMLElement
  static override readonly briefTitle: string = tr('Sample')
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<Sample>
  protected override readonly form2obj :()=>Readonly<Sample>
  protected override readonly onClose :()=>void

  constructor(ctx :GlobalContext, targetStore :AbstractStore<Sample>, targetObj :Sample|null) {
    super(ctx, targetStore, targetObj)
    const obj = this.initObj = targetObj!==null ? targetObj : new Sample(null, null)

    const inpType = safeCastElement(HTMLSelectElement,
      <select class="form-select">
        {sampleTypes.map(t => {
          // NOTE the following i18n.t call removes type safety
          const opt = <option value={t}>{i18n.t('st-'+t, {defaultValue:t})}</option>
          if (obj.type===t) opt.setAttribute('selected','selected')
          return opt
        })}
      </select>)
    const inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="3">{obj.notes.trim()}</textarea>)

    //TODO: measurements[]
    this.onClose = () => {}

    this.el = this.form = this.makeForm(tr('Sample'), [
      this.makeRow(inpType, tr('Sample Type'), <><strong>{tr('Required')}.</strong></>, null),
      this.makeRow(inpNotes, tr('Notes'), <>{tr('samp-notes-help')}</>, null),
    ])

    this.form2obj = () => new Sample({
      type: isSampleType(inpType.value) ? inpType.value : 'undefined',
      notes: inpNotes.value.trim(), measurements: obj.measurements
    }, obj.template)

    this.open()
  }
}