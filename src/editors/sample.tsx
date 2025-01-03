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
import { isSampleType, QualityFlag, Sample, sampleTypes } from '../types/sample'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { Editor, EditorParent } from './base'
import { CustomChangeEvent } from '../events'
import { MeasListEditor } from './meas-list'
import { AbstractStore } from '../storage'
import { makeHelpButton } from '../help'
import { i18n, tr } from '../i18n'

export class SampleEditor extends Editor<SampleEditor, Sample> {
  override readonly currentName
  protected override readonly form2obj
  protected override newObj() { return new Sample(null) }

  private readonly measEdit
  constructor(parent :EditorParent, targetStore :AbstractStore<Sample>, targetObj :Sample|null) {
    super(parent, targetStore, targetObj)
    const obj = this.initObj

    const inpType = safeCastElement(HTMLSelectElement,
      <select class="form-select fw-semibold">
        {sampleTypes.map(t => {
          // NOTE the following i18n.t call removes type safety
          const opt = <option value={t}>{i18n.t('st-'+t, {defaultValue:t}) + (t==='other'?` - ${tr('specify-in-desc')}!`:'')}</option>
          if (obj.type===t) opt.setAttribute('selected','selected')
          return opt
        })}
      </select>)

    const inpDesc = safeCastElement(HTMLInputElement, <input type="text" value={obj.shortDesc.trim()}></input>)

    const inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly>{obj.template?.instructions.trim()??''}</textarea>)
    const rowInst = this.makeRow(inpInst, tr('Instructions'), <>{tr('samp-inst-help')} {tr('temp-copied-readonly')} {tr('inst-see-notes')}</>, null)
    if (!obj.template?.instructions.trim().length)
      rowInst.classList.add('d-none')

    const inpQualGood = safeCastElement(HTMLInputElement,
      <input class="form-check-input" type="radio" name="subjQuality" id="radioQualityGood" value="good" aria-describedby="helpQualityGood" />)
    const inpQualQuest = safeCastElement(HTMLInputElement,
      <input class="form-check-input" type="radio" name="subjQuality" id="radioQualityQuest" value="questionable" aria-describedby="helpQualityQuest" />)
    const inpQualBad = safeCastElement(HTMLInputElement,
      <input class="form-check-input" type="radio" name="subjQuality" id="radioQualityBad" value="bad" aria-describedby="helpQualityBad" />)
    const helpGood = <div id="helpQualityGood" class="form-text d-inline ms-3 manual-help">{tr('qf-desc-good')}</div>
    const helpQuest = <div id="helpQualityQuest" class="form-text d-inline ms-3 manual-help">{tr('qf-desc-quest')}</div>
    const helpBad = <div id="helpQualityBad" class="form-text d-inline ms-3 manual-help">{tr('qf-desc-bad')}</div>
    const grpQuality = safeCastElement(HTMLDivElement,
      <div>
        <div class="form-check" onclick={(event :Event)=>{ if(event.target!==inpQualGood) inpQualGood.click() }}> {inpQualGood}
          <label class="form-check-label text-success-emphasis" for="radioQualityGood"><i class="bi-check-lg"/> {tr('qf-good')}</label>
          {helpGood}
        </div>
        <div class="form-check" onclick={(event :Event)=>{ if(event.target!==inpQualQuest) inpQualQuest.click() }}> {inpQualQuest}
          <label class="form-check-label text-warning-emphasis" for="radioQualityQuest"><i class="bi-question-diamond"/> {tr('qf-questionable')}</label>
          {helpQuest}
        </div>
        <div class="form-check" onclick={(event :Event)=>{ if(event.target!==inpQualBad) inpQualBad.click() }}> {inpQualBad}
          <label class="form-check-label text-danger-emphasis" for="radioQualityBad"><i class="bi-exclamation-triangle" /> {tr('qf-bad')}</label>
          {helpBad}
        </div>
      </div>)
    switch(obj.subjectiveQuality) {
    case 'good': inpQualGood.checked = true; break
    case 'questionable': inpQualQuest.checked = true; break
    case 'bad': inpQualBad.checked = true; break
    case 'undefined': break
    }
    let quality :QualityFlag = obj.subjectiveQuality
    const updQual = () => {
      if (inpQualGood.checked) quality = 'good'
      else if (inpQualQuest.checked) quality = 'questionable'
      else if (inpQualBad.checked) quality = 'bad'
      else quality = 'undefined'
      this.el.dispatchEvent(new CustomChangeEvent())
    }
    inpQualGood.addEventListener('change', updQual)
    inpQualQuest.addEventListener('change', updQual)
    inpQualBad.addEventListener('change', updQual)
    const btnQualHelp = makeHelpButton()
    const subjQualTitle = <>{tr('Subjective Quality')} {btnQualHelp}</>
    btnQualHelp.addEventListener('click', () => {
      helpGood.classList.toggle('manual-help-show')
      helpQuest.classList.toggle('manual-help-show')
      helpBad.classList.toggle('manual-help-show')
    })

    const inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.notes.trim()}</textarea>)

    this.measEdit = new MeasListEditor(this, obj)

    this.form2obj = () => new Sample({ template: obj.template,
      type: isSampleType(inpType.value) ? inpType.value : 'undefined',
      shortDesc: inpDesc.value.trim(), subjectiveQuality: quality,
      notes: inpNotes.value.trim(), measurements: this.measEdit.measurements })
    this.currentName = () => i18n.t('st-'+inpType.value, {defaultValue:inpType.value}) + ( inpDesc.value.trim().length ? ' / '+inpDesc.value.trim() : '' )

    /* TODO Later: Consider a "Next" button to proceed to next sample? (same for locations?) */
    this.initialize([
      this.makeRow(inpType, tr('Sample Type'), <><strong>{tr('Required')}.</strong></>, null),
      this.makeRow(inpDesc, tr('Short Description'), <>{tr('samp-short-desc-help')}</>, null),
      rowInst,
      this.makeRow(grpQuality, subjQualTitle, null, null),
      this.makeRow(inpNotes, tr('Notes'), <>{tr('samp-notes-help')} {tr('notes-help')}</>, null),
      this.measEdit.elWithTitle,
    ])
  }
  protected override customWarnings() :string[] {
    return this.measEdit.customWarnings()
  }
  protected override async onClose() {
    await this.measEdit.close()
  }
}