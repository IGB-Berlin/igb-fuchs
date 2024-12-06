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
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { SamplingLocationTemplate } from '../types/location'
import { AbstractStore, ArrayStore } from '../storage'
import { Wgs84Coordinates } from '../types/coords'
import { SampleTemplateEditor } from './samp-temp'
import { makeCoordinateEditor } from './coords'
import { ListEditorForTemp } from './list-edit'
import { VALID_NAME_RE } from '../types/common'
import { setRemove } from '../types/set'
import { GlobalContext } from '../main'
import { Editor } from './base'
import { tr } from '../i18n'

export class LocationTemplateEditor extends Editor<LocationTemplateEditor, SamplingLocationTemplate> {
  protected override readonly initObj :Readonly<SamplingLocationTemplate>
  protected override readonly form2obj: ()=>Readonly<SamplingLocationTemplate>
  protected override readonly onClose :()=>void

  constructor(ctx :GlobalContext, targetStore :AbstractStore<SamplingLocationTemplate>, targetObj :SamplingLocationTemplate|null) {
    super(ctx, targetStore, targetObj)
    const obj = this.initObj = targetObj!==null ? targetObj : new SamplingLocationTemplate(null)

    const inpName = safeCastElement(HTMLInputElement, <input type="text" required pattern={VALID_NAME_RE.source} value={obj.name} />)
    const inpDesc = safeCastElement(HTMLTextAreaElement, <textarea rows="2">{obj.description.trim()}</textarea>)
    const nomCoords = obj.nomCoords.deepClone().toJSON('')  // don't modify the original object directly!
    const inpNomCoords = makeCoordinateEditor(nomCoords)

    // see notes in trip-temp.tsx about this:
    const sampStore = new ArrayStore(obj.samples)
    const sampEdit = new ListEditorForTemp(this.ctx, sampStore, SampleTemplateEditor, tr('new-samp-from-temp'),
      ()=>Promise.resolve(setRemove(this.ctx.storage.allSampleTemplates, obj.samples)))
    sampStore.events.add(() => this.reportMod())
    sampEdit.watchEnable(this)
    this.onClose = () => sampEdit.close()

    this.form2obj = () =>
      new SamplingLocationTemplate({ name: inpName.value,
        description: inpDesc.value.trim(),
        nominalCoords: new Wgs84Coordinates(nomCoords).deepClone(),
        samples: obj.samples })

    this.initialize([
      this.makeRow(inpName, tr('Name'), <><strong>{tr('Required')}.</strong> {this.makeNameHelp()}</>, tr('Invalid name')),
      this.makeRow(inpDesc, tr('Description'), <>{tr('loc-desc-help')} {tr('desc-help')}</>, null),
      this.makeRow(inpNomCoords, tr('nom-coord'), tr('nom-coord-help'), tr('invalid-coords')),
      sampEdit.withBorder(tr('Samples')),
    ])
  }
}
