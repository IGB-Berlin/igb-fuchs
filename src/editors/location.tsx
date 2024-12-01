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
import { dateTimeLocalInputToDate, getTzOffset } from '../date'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { NO_TIMESTAMP, VALID_NAME_RE } from '../types/common'
import { SamplingLocation } from '../types/location'
import { Wgs84Coordinates } from '../types/coords'
import { makeCoordinateEditor } from './coords'
import { AbstractStore } from '../storage'
import { GlobalContext } from '../main'
import { Editor } from './base'
import { tr } from '../i18n'

export class SamplingLocationEditor extends Editor<SamplingLocationEditor, SamplingLocation> {
  override readonly el :HTMLElement
  static override readonly briefTitle: string = tr('trip-temp')
  protected override readonly form :HTMLFormElement
  protected override readonly initObj :Readonly<SamplingLocation>
  protected override readonly form2obj :()=>Readonly<SamplingLocation>
  protected override readonly onClose :()=>void

  constructor(ctx :GlobalContext, targetStore :AbstractStore<SamplingLocation>, targetObj :SamplingLocation|null) {
    super(ctx, targetStore, targetObj)
    const obj = this.initObj = targetObj!==null ? targetObj : new SamplingLocation(null, null)

    const inpName = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpDesc = safeCastElement(HTMLTextAreaElement, <textarea rows="3">{obj.description.trim()}</textarea>)
    const nomCoords = obj.nomCoords.deepClone().toJSON('')  // don't modify the original object directly!
    const inpNomCoords = makeCoordinateEditor(nomCoords)
    const actCoords = obj.actCoords.deepClone().toJSON('')  // don't modify the original object directly!
    const inpActCoords = makeCoordinateEditor(actCoords)
    const [inpStart, grpStart] = this.makeDtSelect(obj.startTime)
    inpStart.setAttribute('required', 'required')
    const [inpEnd, grpEnd] = this.makeDtSelect(obj.endTime)
    const inpNotes = safeCastElement(HTMLTextAreaElement, <textarea rows="3">{obj.notes.trim()}</textarea>)

    //TODO: samples[]

    this.onClose = () => {}

    const tzOff = getTzOffset(new Date())
    this.el = this.form = this.makeForm(tr('Sampling Location'), [
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), tr('loc-desc-help'), null),
      this.makeRow(inpNomCoords, tr('nom-coord'), tr('nom-coord-help'), tr('invalid-coords')),
      this.makeRow(inpActCoords, tr('act-coord'), tr('act-coord-help'), tr('invalid-coords')),
      this.makeRow(grpStart, tr('Start time'), <><strong>{tr('Required')}.</strong> {tr('loc-start-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      this.makeRow(grpEnd, tr('End time'), <>{tr('loc-end-time-help')}: <strong>{tzOff}</strong></>, tr('Invalid timestamp')),
      this.makeRow(inpNotes, tr('Notes'), <>{tr('loc-notes-help')}</>, null),
    ])

    this.form2obj = () => new SamplingLocation({
      name: inpName.value, description: inpDesc.value.trim(),
      nominalCoords: new Wgs84Coordinates(nomCoords).deepClone(),
      actualCoords: new Wgs84Coordinates(actCoords).deepClone(),
      startTime: dateTimeLocalInputToDate(inpStart)?.getTime() ?? NO_TIMESTAMP,
      endTime:   dateTimeLocalInputToDate(inpEnd)?.getTime() ?? NO_TIMESTAMP,
      samples: obj.samples, notes: inpNotes.value.trim(),
      photos: [], //TODO
    }, null)

    this.open()
  }
}