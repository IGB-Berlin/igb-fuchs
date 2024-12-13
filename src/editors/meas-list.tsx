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
import { MeasurementType } from '../types/meas-type'
import { jsx, safeCastElement } from '../jsx-dom'
import { timestampNow } from '../types/common'
import { ListEditorTemp } from './list-edit'
import { CustomStoreEvent } from '../events'
import { Measurement } from '../types/meas'
import { MeasurementEditor } from './meas'
import { setRemove } from '../types/set'
import { Sample } from '../types/sample'
import { SampleEditor } from './sample'
import { ArrayStore } from '../storage'
import { Tooltip } from 'bootstrap'
import { tr } from '../i18n'

class MiniMeasEditor {
  readonly el :HTMLElement
  readonly meas :Measurement
  private readonly sample :Sample
  private readonly inp :HTMLInputElement
  private readonly inpTooltip :Tooltip
  constructor(sample :Sample, meas :Measurement, saveCallback :()=>Promise<void>) {
    this.sample = sample
    this.meas = meas
    this.inp = safeCastElement(HTMLInputElement, <input type="text" size="5" class="form-control font-monospace z-2 mini-meas-edit"
      title="-" pattern={meas.type.validPattern} value={meas.value} />)
    this.inp.addEventListener('click', event => event.stopPropagation())
    let info :HTMLElement|string = ''
    if (meas.type.instructions.trim().length) {
      info = <button type="button" class="btn btn-outline-secondary text-bg-tertiary" data-bs-toggle="tooltip"
        title={tr('Instructions')+': '+meas.type.instructions.trim()} >
        <i class="bi-info-circle"/><span class="visually-hidden"> {tr('Instructions')}</span></button>
      new Tooltip(info)
      info.addEventListener('click', event => event.stopPropagation())
    }
    this.el = safeCastElement(HTMLDivElement,
      <div class="input-group">
        <span class="input-group-text">{meas.type.name}</span>
        {info} {this.inp}
        <span class="input-group-text">{meas.type.unit}</span>
      </div>)
    this.inp.addEventListener('change', async () => {
      let cks :string[]
      try { cks = this.checks() }
      catch (_) { return }
      // Everything ok, go ahead and save
      this.meas.value = this.inp.value
      this.meas.time = timestampNow()
      await saveCallback()
      if (!cks.length) this.color('good')
    })
    this.inpTooltip = new Tooltip(this.inp)
    this.inp.addEventListener('input', () => this.inpTooltip.hide())
    this.checks()
  }
  private color(state :'clear'|'good'|'warn'|'err') {
    this.inp.classList.toggle('bg-success-subtle', state==='good')
    this.inp.classList.toggle('border-success', state==='good')
    this.inp.classList.toggle('bg-warning-subtle', state==='warn')
    this.inp.classList.toggle('border-warning', state==='warn')
    this.inp.classList.toggle('bg-danger-subtle', state==='err')
    this.inp.classList.toggle('border-danger', state==='err')
  }
  private updateTooltip() {
    this.inpTooltip.setContent({ '.tooltip-inner': this.inp.title })
    this.inpTooltip.enable()
  }
  checks() :string[] {
    this.color('clear')
    let cks :string[]
    try { cks = this.plainChecks() }
    catch (ex) {
      this.inp.title = tr('Error') + ': ' + String(ex)
      this.updateTooltip()
      this.color('err')
      throw ex
    }
    if (cks.length) {
      this.color('warn')
      this.inp.title = tr('Warnings')+': '+cks.join('; ')
      this.updateTooltip()
    }
    else {
      this.inp.title = ''
      this.inpTooltip.disable()
    }
    return cks
  }
  private plainChecks() :string[] {
    if (!this.inp.value.trim().length)
      return [tr('No input')]
    const newMeas = this.meas.deepClone()
    newMeas.value = this.inp.value
    // throwing error on validation fail is correct
    newMeas.validate(this.sample.measurements.filter(m => m!==this.meas))
    return newMeas.warningsCheck()
  }
  async close() {
    this.inpTooltip.dispose()
  }
}

export class MeasListEditor extends ListEditorTemp<MeasurementEditor, MeasurementType, Measurement> {
  private sample
  private editors :MiniMeasEditor[] = []
  constructor(parent :SampleEditor, sample :Readonly<Sample>) {
    super(parent, new ArrayStore(sample.measurements), MeasurementEditor,
      {title:tr('Measurements'), help:tr('meas-list-help')}, tr('new-meas-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allMeasurementTemplates, sample.measurements.map(m => m.extractTemplate()))) )
    this.sample = sample
    setTimeout(async ()=>{
      if (this.sample.template) {
        const types = Array.from(this.sample.template.measurementTypes)
        this.sample.template.measurementTypes.length = 0
        /* The following is very similar to .addNew(), except we only fire one event so there's only one redraw
         * and we don't call .postNew() since that would open a new editor. */
        for (const t of types) {
          const newMeas = t.templateToObject()
          console.debug('Adding',newMeas,'...')
          const newId = await this.theStore.add(newMeas)
          console.debug('... added with id',newId)
        }
        if (types.length)
          this.el.dispatchEvent(new CustomStoreEvent({ action: 'add', id: null }))
      }
    })
  }
  protected override makeNew(t :MeasurementType) :Measurement { return t.templateToObject() }
  protected override postNew(obj :Measurement) { this.newEditor(obj) }
  /** See `Editor.customWarnings()`: Return array of warnings, or throw error on validation fail */
  customWarnings() :string[] {
    return this.editors.flatMap(ed => ed.checks().map(c => `${ed.meas.type.name}: ${c}`))
  }
  protected override contentFor(meas :Measurement) {
    const ed = this.editors.find(e => Object.is(meas, e.meas))  // expensive search
    if (ed) return ed.el
    const newEd = new MiniMeasEditor(this.sample, meas, async () => {
      console.debug('Saving', meas,'...')
      const id = await this.theStore.upd(meas, meas)
      // Don't fire a CustomStoreEvent since that would redraw this list
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
}
