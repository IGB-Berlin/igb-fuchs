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
  private readonly inpType
  private readonly inpDesc
  private quality :QualityFlag
  private readonly inpNotes
  private readonly measEdit
  constructor(parent :EditorParent, targetStore :AbstractStore<Sample>, targetObj :Sample|null) {
    super(parent, targetStore, targetObj)

    this.inpType = safeCastElement(HTMLSelectElement,
      <select class="form-select fw-semibold">
        {sampleTypes.map(t => {
          // NOTE the following i18n.t call (and others like it) removes type safety
          const opt = <option value={t}>{i18n.t('st-'+t, {defaultValue:t}) + (t==='other'?` - ${tr('specify-in-desc')}!`:'')}</option>
          if (this.initObj.type===t) opt.setAttribute('selected','selected')
          return opt
        })}
      </select>)

    this.inpDesc = safeCastElement(HTMLInputElement, <input type="text" value={this.initObj.shortDesc.trim()}></input>)

    const inpInst = safeCastElement(HTMLTextAreaElement, <textarea rows="2" readonly>{this.initObj.template?.instructions.trim()??''}</textarea>)
    const rowInst = this.makeRow(inpInst, tr('Instructions'), <>{tr('samp-inst-help')} {tr('temp-copied-readonly')} {tr('inst-see-notes')}</>, null)
    if (!this.initObj.template?.instructions.trim().length)
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
    switch(this.initObj.subjectiveQuality) {
    case 'good': inpQualGood.checked = true; break
    case 'questionable': inpQualQuest.checked = true; break
    case 'bad': inpQualBad.checked = true; break
    case 'undefined': break
    }
    this.quality = this.initObj.subjectiveQuality
    const updQual = () => {
      if (inpQualGood.checked) this.quality = 'good'
      else if (inpQualQuest.checked) this.quality = 'questionable'
      else if (inpQualBad.checked) this.quality = 'bad'
      else this.quality = 'undefined'  // shouldn't happen
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

    this.inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{this.initObj.notes.trim()}</textarea>)

    this.measEdit = new MeasListEditor(this, this.initObj)

    //TODO: A "Next" button to proceed to next sample, or to next location when all planned samples are done.
    this.initialize([
      this.makeRow(this.inpType, tr('Sample Type'), <><strong>{tr('Required')}.</strong></>, null),
      this.makeRow(this.inpDesc, tr('Short Description'), <>{tr('samp-short-desc-help')}</>, null),
      rowInst,
      this.makeRow(grpQuality, subjQualTitle, null, null),
      this.makeRow(this.inpNotes, tr('Notes'), <>{tr('samp-notes-help')} {tr('notes-help')}</>, null),
      this.measEdit.elWithTitle,
    ])
  }

  protected override newObj() { return new Sample(null) }

  protected override form2obj() {
    return new Sample({ template: this.initObj.template,
      type: isSampleType(this.inpType.value) ? this.inpType.value : 'undefined',
      shortDesc: this.inpDesc.value.trim(), subjectiveQuality: this.quality,
      notes: this.inpNotes.value.trim(), measurements: this.measEdit.measurements })
  }

  override currentName() {
    return i18n.t('st-'+this.inpType.value, { defaultValue: this.inpType.value })
      + ( this.inpDesc.value.trim().length ? ' / '+this.inpDesc.value.trim() : '' )
  }

  protected override doScroll() {
    this.ctx.scrollTo(
      this.isBrandNew || !isSampleType(this.inpType.value) || this.inpType.value === 'undefined' ? this.inpType
        : this.inpType.value === 'other' && !this.inpDesc.value.trim().length ? this.inpDesc
          : this.measEdit.el )
  }

  protected override customWarnings() :string[] { return this.measEdit.customWarnings() }
  protected override async onClose() { await this.measEdit.close() }

}