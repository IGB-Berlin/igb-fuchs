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
import { ListEditor, ListEditorParent, ListEditorWithTemp, SelectedItemContainer } from './list-edit'
import { SamplingProcedureEditor } from './samp-proc'
import { makeImportExport } from '../import-export'
import { SamplingLogEditor } from './samp-log'
import { makeSettings } from '../settings'
import { GlobalContext } from '../main'
import { jsx } from '../jsx-dom'
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

  const selItem :SelectedItemContainer = { el: null }
  const dummyParent :ListEditorParent = { ctx: ctx, el: null, isUnsaved: false,
    selfUpdate: ()=>{ throw new Error('this should not be called') } } as const

  const logEdit = new ListEditorWithTemp(dummyParent, ctx.storage.samplingLogs, SamplingLogEditor, selItem,
    { title: tr('saved-pl')+' '+tr('Sampling Logs'), planned: tr('planned-pl')+' '+tr('Sampling Logs') },
    tr('new-log-from-proc'), async () => (await ctx.storage.samplingProcedures.getAll(null)).map(([_,t])=>t), null)
  logEdit.highlightButton('temp')

  const procEdit = new ListEditor(dummyParent, ctx.storage.samplingProcedures, SamplingProcedureEditor, selItem,
    { title: tr('Sampling Procedures') } )

  const inpExp = makeImportExport(ctx, logEdit, procEdit)

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
