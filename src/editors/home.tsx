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
import { ListEditor, ListEditorParent, ListEditorWithTemp } from './list-edit'
import { SamplingProcedureEditor } from './samp-proc'
import { makeImportExport } from '../import-export'
import { SamplingLogEditor } from './samp-log'
import { jsx, jsxFragment } from '../jsx-dom'
import { getStyle } from '../types/styles'
import { makeSettings } from '../settings'
import { GlobalContext } from '../main'
import { StackAble } from './stack'
import { tr } from '../i18n'

function makeAcc(ctx :GlobalContext, title :HTMLElement|string, body :HTMLElement|string, expanded :boolean = false) {
  const accId = ctx.genId('HomeAccordion')
  return <div class="accordion-item">
    <h2 class="accordion-header">
      <button class={'accordion-button' + (expanded?'':' collapsed')} type="button" data-bs-toggle="collapse"
        data-bs-target={`#${accId}`} aria-expanded={expanded ? 'true' : 'false'} aria-controls={accId}>
        {title}
      </button>
    </h2>
    <div id={accId} class={'accordion-collapse collapse' + (expanded?' show':'')} data-bs-parent="#homeAccordion">
      <div class="accordion-body pt-2 pb-3 px-2 p-sm-4">
        {body}
      </div>
    </div>
  </div>
}

export class HomePage implements StackAble, ListEditorParent {
  readonly style = getStyle(this.constructor)
  readonly unsavedChanges = false
  readonly isUnsaved = false
  checkValidity() :Promise<['good','']> { return Promise.resolve(['good','']) }
  requestClose() :Promise<boolean> { throw new Error('HomePage.requestClose shouldn\'t happen') }
  doSaveAndClose() :Promise<boolean> { throw new Error('HomePage.doSaveAndClose shouldn\'t happen') }
  close() :Promise<void> { throw new Error('HomePage.close shouldn\'t happen') }
  doNext() :Promise<void> { throw new Error('HomePage.doNext shouldn\'t happen') }
  selfUpdate() :Promise<void> { /*throw new Error('HomePage.selfUpdate shouldn\'t happen')*/ return Promise.resolve() }  //TODO Later: Why is HomePage.selfUpdate being called now?
  nextButtonText() { return null }
  currentName() { return this.style.briefTitle }
  shown() {}
  readonly ctx
  readonly el
  private constructor(ctx :GlobalContext, el :HTMLElement) { this.ctx = ctx; this.el = el }
  static async new(ctx :GlobalContext) {
    const homePage = new HomePage(ctx, <div class="p-2 p-sm-3"></div>)

    const logEdit = await new ListEditorWithTemp(homePage, ctx.storage.samplingLogs, SamplingLogEditor, { el: null },
      { title: tr('saved-pl')+' '+tr('Sampling Logs'), planned: tr('planned-pl')+' '+tr('Sampling Logs') },
      tr('new-log-from-proc'), async () => (await ctx.storage.samplingProcedures.getAll(null)).map(([_,t])=>t), null).initialize()
    logEdit.highlightButton('temp')

    const procEdit = await new ListEditor(homePage, ctx.storage.samplingProcedures, SamplingProcedureEditor, { el: null },
      { title: tr('Sampling Procedures') } ).initialize()

    const inpExp = makeImportExport(ctx, logEdit, procEdit)

    const settings = await makeSettings(ctx)

    /* TODO: Unter "Messprotokolle" die Knöpfe "Neu" und "Löschen" in einem Dropdown "Erweitert" verstecken */
    const logStyle = getStyle(SamplingLogEditor)
    const procStyle = getStyle(SamplingProcedureEditor)
    homePage.el.appendChild(<div class="accordion" id="homeAccordion">
      {makeAcc(ctx, <strong><i class={`bi-${logStyle.icon} me-1`}/>{tr('Sampling Logs')}</strong>, logEdit.el, true)}
      {makeAcc(ctx, <><i class={`bi-${procStyle.icon} me-1`}/>{tr('Sampling Procedures')} ({tr('Log Templates')})</>, procEdit.el)}
      {makeAcc(ctx, tr('import-export'), inpExp)}
      {makeAcc(ctx, tr('Settings'), settings)}
    </div>)
    return homePage
  }
}
