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
import { isSampleType, QualityFlag, Sample, sampleTypes } from '../types/sample'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { WtwConnControl, WtwDataReceivedEvent } from '../wtw'
import { Editor, EditorParent } from './base'
import { CustomChangeEvent } from '../events'
import { MeasListEditor } from './meas-list'
import { AbstractStore } from '../storage'
import { makeHelpButton } from '../help'
import { i18n, tr } from '../i18n'
import { assert } from '../utils'

class QualityEditor {
  readonly el
  readonly titleEl
  private _quality :QualityFlag
  get quality() { return this._quality }
  constructor(initialQuality :QualityFlag) {
    const inpQualGood = safeCastElement(HTMLInputElement,
      <input class="form-check-input" type="radio" name="subjQuality" id="radioQualityGood" value="good" aria-describedby="helpQualityGood" />)
    const inpQualQuest = safeCastElement(HTMLInputElement,
      <input class="form-check-input" type="radio" name="subjQuality" id="radioQualityQuest" value="questionable" aria-describedby="helpQualityQuest" />)
    const inpQualBad = safeCastElement(HTMLInputElement,
      <input class="form-check-input" type="radio" name="subjQuality" id="radioQualityBad" value="bad" aria-describedby="helpQualityBad" />)
    const helpGood = <div id="helpQualityGood" class="form-text d-inline ms-3 manual-help">{tr('qf-desc-good')}</div>
    const helpQuest = <div id="helpQualityQuest" class="form-text d-inline ms-3 manual-help">{tr('qf-desc-quest')}</div>
    const helpBad = <div id="helpQualityBad" class="form-text d-inline ms-3 manual-help">{tr('qf-desc-bad')}</div>
    this.el = safeCastElement(HTMLDivElement,
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
    switch(initialQuality) {
      case 'good': inpQualGood.checked = true; break
      case 'questionable': inpQualQuest.checked = true; break
      case 'bad': inpQualBad.checked = true; break
      case 'undefined': break
    }
    this._quality = initialQuality
    const updQual = () => {
      if (inpQualGood.checked) this._quality = 'good'
      else if (inpQualQuest.checked) this._quality = 'questionable'
      else if (inpQualBad.checked) this._quality = 'bad'
      else this._quality = 'undefined'  // shouldn't happen
      this.el.dispatchEvent(new CustomChangeEvent())
    }
    inpQualGood.addEventListener('change', updQual)
    inpQualQuest.addEventListener('change', updQual)
    inpQualBad.addEventListener('change', updQual)
    const btnQualHelp = makeHelpButton()
    this.titleEl = <>{tr('Subjective Quality')} {btnQualHelp}</>
    btnQualHelp.addEventListener('click', () => {
      helpGood.classList.toggle('manual-help-show')
      helpQuest.classList.toggle('manual-help-show')
      helpBad.classList.toggle('manual-help-show')
    })
  }
}

export class SampleEditor extends Editor<Sample> {
  private readonly inpType
  private readonly inpDesc
  private readonly qualEditor
  private readonly inpNotes
  private readonly measEdit
  constructor(parent :EditorParent, targetStore :AbstractStore<Sample>, targetObj :Sample|null, isNew :boolean) {
    super(parent, targetStore, targetObj, isNew)

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

    const rowInst = this.makeTextAreaRow(this.initObj.template?.instructions, {
      label: tr('Instructions'), helpText: <>{tr('samp-inst-help')} {tr('temp-copied-readonly')} {tr('inst-see-notes')}</>,
      readonly: true, startExpanded: this.isNew, hideWhenEmpty: true })[0]

    this.qualEditor = new QualityEditor(this.initObj.subjectiveQuality)
    this.qualEditor.el.addEventListener(CustomChangeEvent.NAME, () => this.el.dispatchEvent(new CustomChangeEvent()))

    const [rowNotes, inpNotes] = this.makeTextAreaRow(this.initObj.notes, {
      label: tr('Notes'), helpText: <>{tr('samp-notes-help')} {tr('notes-help')}</>, startExpanded: true })
    this.inpNotes = inpNotes

    this.measEdit = new MeasListEditor(this, this.initObj)

    const wtwCtrl = new WtwConnControl()
    wtwCtrl.addEventListener(WtwDataReceivedEvent.NAME, event => {
      assert(event instanceof WtwDataReceivedEvent)
      console.log(event.detail.results)  //TODO
    })

    this.setFormContents([
      this.makeRow(this.inpType, { label: tr('Sample Type'), helpText: <><strong>{tr('Required')}.</strong></> }),
      this.makeRow(this.inpDesc, { label: tr('Short Description'), helpText: <>{tr('samp-short-desc-help')}</> }),
      rowInst,
      this.makeRow(this.qualEditor.el, { label: this.qualEditor.titleEl }),
      rowNotes,
      this.makeRow(wtwCtrl, { label: 'WTW®', helpText: <>{tr('wtw-legal')}</> }),
      this.measEdit.elWithTitle,
    ])
  }
  override async initialize() {
    await this.measEdit.initialize()
    await this.initDone()
    return this
  }

  protected override newObj() { return new Sample(null) }

  protected override form2obj() {
    return new Sample({ template: this.initObj.template,
      type: isSampleType(this.inpType.value) ? this.inpType.value : 'undefined',
      shortDesc: this.inpDesc.value.trim(), subjectiveQuality: this.qualEditor.quality,
      notes: this.inpNotes.value.trim(), measurements: this.measEdit.measurements })
  }

  override currentName(short :boolean) {
    return i18n.t((short?'sts-':'st-')+this.inpType.value, { defaultValue: this.inpType.value })
      + ( this.inpDesc.value.trim().length ? ' / '+this.inpDesc.value.trim() : '' )
  }

  protected override doScroll(pushNotPop :boolean) {
    this.ctx.scrollTo( this.isNew && pushNotPop || !isSampleType(this.inpType.value) || this.inpType.value === 'undefined' ? this.inpType
      : this.inpType.value === 'other' && !this.inpDesc.value.trim().length ? this.inpDesc
        : ( this.measEdit.scrollTarget() ?? this.btnSaveClose ) )
  }

  protected override customValidation() :string[] { return this.measEdit.customValidation() }
  protected override async onClose() { await this.measEdit.close() }

}