/** This file is part of IGB-FUCHS.
 *
 * WTW® is a registered trademark of Xylem Analytics Germany GmbH.
 * This project is not affiliated with, endorsed by, or sponsored by Xylem or its subsidiaries.
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
import { WtwConnControl, WtwConnector, WtwDataReceivedEvent } from '../wtw'
import { jsx, jsxFragment, safeCast } from '@haukex/simple-jsx-dom'
import { IMeasurement, Measurement } from '../types/measurement'
import { infoDialog, overAppendDialog } from '../dialogs'
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
    const inpQualGood = safeCast(HTMLInputElement,
      <input class="form-check-input" type="radio" name="subjQuality" id="radioQualityGood" value="good" aria-describedby="helpQualityGood" />)
    const inpQualQuest = safeCast(HTMLInputElement,
      <input class="form-check-input" type="radio" name="subjQuality" id="radioQualityQuest" value="questionable" aria-describedby="helpQualityQuest" />)
    const inpQualBad = safeCast(HTMLInputElement,
      <input class="form-check-input" type="radio" name="subjQuality" id="radioQualityBad" value="bad" aria-describedby="helpQualityBad" />)
    const helpGood = <div id="helpQualityGood" class="form-text d-inline ms-3 manual-help">{tr('qf-desc-good')}</div>
    const helpQuest = <div id="helpQualityQuest" class="form-text d-inline ms-3 manual-help">{tr('qf-desc-quest')}</div>
    const helpBad = <div id="helpQualityBad" class="form-text d-inline ms-3 manual-help">{tr('qf-desc-bad')}</div>
    this.el = safeCast(HTMLDivElement,
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

    this.inpType = safeCast(HTMLSelectElement,
      <select class="form-select fw-semibold">
        {sampleTypes.map(t => {
          // NOTE the following i18n.t call (and others like it) removes type safety
          const opt = <option value={t}>{i18n.t('st-'+t, {defaultValue:t}) + (t==='other'?` - ${tr('specify-in-desc')}!`:'')}</option>
          if (this.initObj.type===t) opt.setAttribute('selected','selected')
          return opt
        })}
      </select>)

    this.inpDesc = safeCast(HTMLInputElement, <input type="text" value={this.initObj.shortDesc.trim()}></input>)

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
    wtwCtrl.addEventListener(WtwDataReceivedEvent.NAME, async event => {
      assert(event instanceof WtwDataReceivedEvent)
      if (!event.detail.results.length) return
      // Note we'll assume that typically, we're only getting one result at a time, so all of the processing is *inside* this loop:
      for (const res of event.detail.results) {
        const anyImported = await this.importMeasurements(res.meas)
        if (anyImported) {
          inpNotes.value += '\n-----\n' + res.raw + '\n-----\n'
          this.el.dispatchEvent(new CustomChangeEvent())  // b/c setting `.value` doesn't fire a `change` event
        }
      }
    })
    const rowWtw = this.makeRow(wtwCtrl, { label: 'WTW®', helpText: <>{tr('wtw-help')} {tr('wtw-legal')}</> })
    const [accProbes, collProbes] = this.makeAccordion({ label: tr('Probe Tools'),
      title: <>WTW®: {wtwCtrl.elStatus}</>, rows: [rowWtw] })

    this.setFormContents([
      this.makeRow(this.inpType, { label: tr('Sample Type'), helpText: <><strong>{tr('Required')}.</strong></> }),
      this.makeRow(this.inpDesc, { label: tr('Short Description'), helpText: <>{tr('samp-short-desc-help')}</> }),
      rowInst,
      this.makeRow(this.qualEditor.el, { label: this.qualEditor.titleEl }),
      rowNotes,
      accProbes,
      this.measEdit.elWithTitle,
    ])

    setTimeout(() => {  // needs to be deferred because the Elements need to be in the DOM
      if (this.initObj.type==='probe' && WtwConnector.instance.state!='connected'
        && WtwConnector.instance.state!='not-available' ) collProbes().show()
    })
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

  /** Import measurements.
   *
   * @returns Whether any measurements were imported.
   */
  private async importMeasurements(meas :IMeasurement[]) :Promise<boolean> {
    if (this.isUnsaved) {
      await infoDialog('error', tr('Error'), tr('import-unsaved-error'))
      return false }
    if (!Object.is( this.ctx.stack.top, this )) {
      await infoDialog('error', tr('Error'), tr('import-only-sample'))
      return false }
    // first, group the measurements by type
    const byTypeId = new Map<string, Measurement[]>()
    for (const im of meas) {
      const m = new Measurement(im)
      const v = byTypeId.get(m.type.typeId)
      if (v) v.push(m)
      else byTypeId.set(m.type.typeId, [m])
    }
    // now analyze
    let infos :number = 0
    let asks :number = 0
    const oli :HTMLElement[] = []
    const actions :Measurement[][] = []
    for (const nms of byTypeId.values()) {
      // if there's more than one measurement of this type in the import (very unlikely), we're only importing the last...
      const nm = nms.at(-1)
      assert(nm)
      const uli :HTMLElement[] = [
        <li class="text-info"><i class="bi-plus-circle me-1"/>
          <span class="me-1">{tr('Importing')}:</span> {nm.summaryAsHtml(false, true)}</li> ]
      // ... and informing the user about the other measurements if they differ from the one we're importing
      for (const onm of nms.slice(0,-1))
        if ( !nm.sameAs(onm, true) ) {
          uli.push(<li class="text-danger"><i class="bi-trash3 me-1"/>
            <span class="me-1">{tr('Duplicate, ignoring')}:</span> {onm.summaryAsHtml(false, true)}</li>)
          infos++
        }
      // check what measurements of this same type we already have
      const have = this.measEdit.measurements.filter(hm => nm.type.typeId === hm.type.typeId)
      for (const hm of have)
        if ( !nm.sameAs(hm) ) {
          // the measurement we already have differs from the new one
          uli.push(<li class="text-warning"><i class="bi-question-diamond me-1"/>
            <span class="me-1">{tr('Existing')}:</span> {hm.summaryAsHtml(false, true)}</li>)
          asks++
        } /* else, this measurement we already have is the same as the one being imported, and if the user selects "overwrite",
           * or if all measurements being imported are the same as to the ones we already have (in which case there'll be no `asks`),
           * the existing measurement(s) can be deleted without asking the user - which is basically just a timestamp update. */
      actions.push([nm].concat(have))
      oli.push(<li>{nm.type.summaryAsHtml(false)}<ul>{uli}</ul></li>)
    }
    // now ask or inform the user
    let overwrite_not_append = true  // see explanation above for why we default to overwrite
    if (asks) {  // we need to ask about overwrite/append
      const act = await overAppendDialog(tr('Importing Measurements'),
        <><p>{tr('ask-over-append')}</p><ol>{oli}</ol></>)
      if (act=='cancel') return false
      if (act=='append') overwrite_not_append = false
    }
    else if (infos)  // no questions, just information for the user
      await infoDialog('warning', tr('Importing Measurements'), <><p>{tr('import-info')}:</p><ol>{oli}</ol></>)
    // now actually perform actions
    for(const [nm, ...os] of actions) {
      assert(nm)
      if (os.length) {
        if (overwrite_not_append) {
          console.debug('Imported measurement',nm,'overwrites',os)
          for (const o of os)
            await this.measEdit.deleteItem(o)
        } else console.debug('Appending imported measurement',nm)
      }
      else console.debug('Adding imported measurement',nm)
      await this.measEdit.addItem(new Measurement(nm))
    }
    return !!actions.length
  }

}