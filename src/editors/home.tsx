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
import { ListEditor, ListEditorWithTemp } from './list-edit'
import { SamplingProcedureEditor } from './samp-proc'
import { makeImportExport } from '../import-export'
import { samplingLogToCsv } from '../types/log2csv'
import { jsx, safeCastElement } from '../jsx-dom'
import { SamplingLog } from '../types/sampling'
import { SamplingLogEditor } from './samp-log'
import { CustomStoreEvent } from '../events'
import { makeSettings } from '../settings'
import { GlobalContext } from '../main'
import { shareFile } from '../share'
import { assert } from '../utils'
import { tr } from '../i18n'

let _accId = 0
function makeAcc(title :string, body :HTMLElement|string) {
  return <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
        data-bs-target={`#${++_accId}`} aria-expanded="false" aria-controls={_accId}>
        {title}
      </button>
    </h2>
    <div id={_accId} class="accordion-collapse collapse" data-bs-parent="#homeAccordion">
      <div class="accordion-body pt-2 pb-3 px-2 p-sm-4">
        {body}
      </div>
    </div>
  </div>
}

export function makeHomePage(ctx :GlobalContext) {

  const btnShare = safeCastElement(HTMLButtonElement,
    <button type="button" class="btn btn-outline-primary text-nowrap ms-3 mt-1"><i class="bi-share-fill"/> {tr('Export CSV')}</button>)

  const dummyParent = { ctx: ctx, el: null, isBrandNew: false,
    selfUpdate: ()=>{ throw new Error('this should not be called') } } as const

  const logEdit = new ListEditorWithTemp(dummyParent, ctx.storage.samplingLogs, SamplingLogEditor,
    { title:tr('saved-pl')+' '+tr('Sampling Logs'), planned:tr('planned-pl')+' '+tr('Sampling Logs') },
    tr('new-log-from-proc'), async () => (await ctx.storage.samplingProcedures.getAll(null)).map(([_,t])=>t), null)
  logEdit.addButton(btnShare, (obj :SamplingLog) => shareFile(samplingLogToCsv(obj)))
  logEdit.highlightButton('temp')

  const procEdit = new ListEditor(dummyParent, ctx.storage.samplingProcedures, SamplingProcedureEditor, {title:tr('Sampling Procedures')})

  const inpExp = makeImportExport(ctx)
  // inform the list editors of the import so they update themselves
  inpExp.addEventListener(CustomStoreEvent.NAME, event => {
    assert(event instanceof CustomStoreEvent)
    logEdit.el.dispatchEvent(new CustomStoreEvent(event.detail))
    procEdit.el.dispatchEvent(new CustomStoreEvent(event.detail))
  })

  const settings = makeSettings(ctx)

  return <div class="p-2 p-sm-3">
    <div class="accordion" id="homeAccordion">
      {makeAcc(tr('Sampling Logs'), logEdit.el)}
      {makeAcc(`${tr('Sampling Procedures')} (${tr('Log Templates')})`, procEdit.el)}
      {makeAcc(tr('import-export'), inpExp)}
      {makeAcc(tr('Settings'), settings)}
    </div>
  </div>
}
