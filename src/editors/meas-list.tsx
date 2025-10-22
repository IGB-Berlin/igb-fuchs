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
import { ListEditorTemp, SelectedItemContainer } from './list-edit'
import { MeasurementType, Measurement } from '../types/measurement'
import { makeValidNumberPat, timestampNow } from '../types/common'
import { CustomChangeEvent, CustomStoreEvent } from '../events'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { numericTextInputStuff } from '../utils'
import { MeasurementEditor } from './meas'
import { setRemove } from '../types/set'
import { Sample } from '../types/sample'
import { SampleEditor } from './sample'
import { ArrayStore } from '../storage'
import { MyTooltip } from '../tooltip'
import { tr } from '../i18n'

class MiniMeasEditor {
  readonly el
  readonly meas
  private readonly parent
  private readonly sample
  private readonly inp
  private readonly tipInp
  private readonly tipInfo
  constructor(parent :MeasListEditor, sample :Sample, meas :Measurement, saveCallback :()=>Promise<void>) {
    this.parent = parent
    this.sample = sample
    this.meas = meas
    this.inp = safeCastElement(HTMLInputElement, <input type="text" inputmode="decimal"
      class="form-control font-monospace z-2 mini-meas-edit text-end" size="5"
      pattern={makeValidNumberPat(meas.type.precision)} value={meas.value}/>)
    numericTextInputStuff(this.inp)
    this.inp.addEventListener('click', event => event.stopPropagation())  // prevent the list entry from selecting & highlighting
    this.inp.addEventListener('dblclick', event => event.stopPropagation())
    let info :HTMLElement|string = ''
    if (meas.type.instructions.trim().length) {
      info = <button type="button" class="btn btn-outline-secondary text-bg-tertiary" data-bs-toggle="tooltip"
        title={tr('Instructions')+': '+meas.type.instructions.trim()} >
        <i class="bi-info-circle"/><span class="visually-hidden"> {tr('Instructions')}</span></button>
      this.tipInfo = new MyTooltip(info)
      info.addEventListener('click', event => event.stopPropagation())
    } else this.tipInfo = null
    this.el = safeCastElement(HTMLDivElement,
      <div class="input-group">
        <span class="input-group-text">{meas.type.name}</span>
        {info} {this.inp}
        <span class="input-group-text">{meas.type.unit}</span>
      </div>)
    this.inp.addEventListener('change', async () => {
      let cks :string[]
      try { cks = this.checks() }
      catch (_) {
        /* This exception+return interrupts the normal flow (below) of saveCallback() -> Editor.selfUpdate(), which
         * prevents the Editor from seeing this error immediately, so we have to manually fire the event. */
        this.parent.fireChange()
        return
      }
      // Everything ok so far (though there may be warnings), go ahead and save
      this.meas.value = this.inp.value
      this.meas.time = timestampNow()
      await saveCallback()
      if (!cks.length) this.color('good')
    })
    this.inp.title = '-'  // needs a title or Tooltip won't init
    this.tipInp = new MyTooltip(this.inp)
    this.inp.addEventListener('input', () => this.tipInp.hide())
    try { this.checks() } catch (_) { /* ignore; input field will be colored */ }
  }
  private color(state :'clear'|'good'|'warn'|'err') {
    this.inp.classList.toggle('bg-success-subtle', state==='good')
    this.inp.classList.toggle('border-success', state==='good')
    this.inp.classList.toggle('bg-warning-subtle', state==='warn')
    this.inp.classList.toggle('border-warning', state==='warn')
    this.inp.classList.toggle('bg-danger-subtle', state==='err')
    this.inp.classList.toggle('border-danger', state==='err')
  }
  checks() :string[] {
    this.color('clear')
    let cks :string[]
    try { cks = this.plainChecks() }
    catch (ex) {  // validation error
      this.tipInp.update( tr('Error') + ': ' + String(ex) )
      this.color('err')
      throw ex
    }
    if (cks.length) {  // warnings
      this.color('warn')
      // If the only warning is "No input", suppress the tooltip since it should be obvious...
      if (cks.length===1 && cks[0]===tr('No input')) this.tipInp.update(null)
      else this.tipInp.update( tr('Warnings')+': '+cks.join('; ') )
    }
    else this.tipInp.update(null)
    return cks
  }
  private plainChecks() :string[] {
    if (!this.inp.value.trim().length) return [tr('No input')]
    const newMeas = this.meas.deepClone()
    newMeas.value = this.inp.value
    newMeas.time = timestampNow()
    // the following may throw an error on validation fail, which we want
    newMeas.validate(this.sample.measurements.filter(m => m!==this.meas))
    return newMeas.warningsCheck()
  }
  async close() {
    await this.tipInp.close()
    await this.tipInfo?.close()
    this.inp.setAttribute('readonly','readonly')  // not really needed, just playing it safe
  }
}

export class MeasListEditor extends ListEditorTemp<MeasurementType, Measurement> {
  private sample
  private readonly editors :MiniMeasEditor[] = []
  constructor(parent :SampleEditor, sample :Readonly<Sample>) {
    const selItem :SelectedItemContainer = { el: null }
    super(parent, new ArrayStore(sample.measurements), MeasurementEditor, Measurement.sStyle, selItem,
      { title:tr('Measurements'), help:<>{tr('meas-list-help')}
        {' '} {tr('dot-minus-hack')} <strong>{tr('Caution')}:</strong> {tr('meas-list-help-important')}</> },
      tr('new-meas-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allMeasurementTemplates, sample.measurements.map(m => m.extractTemplate()))) )
    this.sample = sample
  }
  override async initialize() {
    // convert planned MeasurementTypes into Measurements
    if (this.sample.template) {
      const types = Array.from(this.sample.template.measurementTypes)
      this.sample.template.measurementTypes.length = 0
      /* The following is very similar to ListEditorTemp.addNew(), except we only fire one event (below)
       * so there's only one redraw and we don't call ListEditor.newEditor(). */
      for (const t of types) {
        const newMeas = this.makeNew(t)
        console.debug('Adding',newMeas,'...')
        const newId = await this.theStore.add(newMeas)
        console.debug('... added with id',newId)
      }
      if (types.length)  // fire a single update event for all measurements
        this.el.dispatchEvent(new CustomStoreEvent({ action: 'add', id: null }))
    }
    /* Don't call our parent's init until we've added the measurements, since it redraws the list and
     * thereby spawns the `MiniMeasEditor`s via `contentFor`, which we in turn need for `customValidation`. */
    await super.initialize()
    return this
  }

  protected override makeNew(t :MeasurementType) :Measurement { return t.templateToObject() }
  /** See `Editor.customValidation()`: Return array of warnings, or throw error on validation fail */
  customValidation() :string[] {
    return this.editors.flatMap(ed => ed.checks().map(c => `${ed.meas.type.typeId}: ${c}`))
  }
  /** Scroll to either the first measurement with an issue (this includes empty values), otherwise the last selected item, if any */
  scrollTarget() :HTMLElement|null|undefined {
    return this.editors.find(ed => {
      try { return ed.checks().length }
      catch (_) { return true }
    })?.el ?? this.selItem.el
  }
  protected override contentFor(meas :Measurement) {
    const ed = this.editors.find(e => Object.is(meas, e.meas))  // expensive search
    if (ed) return ed.el
    const newEd = new MiniMeasEditor(this, this.sample, meas, async () => {
      console.debug('Saving', meas,'...')
      const id = await this.theStore.upd(meas, meas)  // similar to what Editor.selfUpdate() does
      // Don't fire a CustomStoreEvent since that would redraw this list, instead just do the same thing the event would do (see the ListEditor code)
      await this.parent.selfUpdate()
      console.debug('... saved with id',id)
    })
    this.editors.push(newEd)
    return newEd.el
  }
  get measurements() :Measurement[] {
    return this.sample.measurements
  }
  async close() {
    await Promise.all( this.editors.map(ed => ed.close()) )
    this.editors.length = 0
  }
  /** For use by MiniMeasEditor only. */
  fireChange() { this.parent.el?.dispatchEvent(new CustomChangeEvent()) }
}
