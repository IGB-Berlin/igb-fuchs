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
import { ListEditor, ListEditorParent, ListEditorWithTemp } from './list-edit'
import { SamplingLog, SamplingProcedure } from '../types/sampling'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { SamplingProcedureEditor } from './samp-proc'
import { ImportExportTool } from '../import-export'
import { SamplingLogEditor } from './samp-log'
import { CustomStoreEvent } from '../events'
import { StyleValue } from '../types/common'
import { makeSettings } from '../settings'
import { GlobalContext } from '../main'
import { StackAble } from './stack'
import { tr } from '../i18n'

function makeAcc(ctx :GlobalContext, bodyTestId :string, title :HTMLElement|string, body :HTMLElement|string, expanded :boolean = false) {
  const accId = ctx.genId('HomeAccordion')
  return <div class="accordion-item">
    <h2 class="accordion-header">
      <button class={'accordion-button' + (expanded?'':' collapsed')} type="button" data-bs-toggle="collapse"
        data-bs-target={`#${accId}`} aria-expanded={expanded ? 'true' : 'false'} aria-controls={accId}>
        {title}
      </button>
    </h2>
    <div id={accId} class={'accordion-collapse collapse' + (expanded?' show':'')} data-bs-parent="#homeAccordion">
      <div class="accordion-body pt-2 pb-3 px-2 p-sm-4" data-test-id={bodyTestId}>
        {body}
      </div>
    </div>
  </div>
}

export class HomePage implements StackAble, ListEditorParent {
  static readonly sStyle :StyleValue = { isTemplate: false, opposite: null,
    fullTitle: tr('Home'), briefTitle: tr('Home'), cssId: 'home', icon: 'house-fill' }
  static { this.sStyle.opposite = this.sStyle }
  readonly style = HomePage.sStyle
  readonly unsavedChanges = false
  readonly isUnsaved = false
  checkValidity() :Promise<['good','']> { return Promise.resolve(['good','']) }
  requestClose() :Promise<boolean> { throw new Error('HomePage.requestClose shouldn\'t happen') }
  doSaveAndClose() :Promise<boolean> { throw new Error('HomePage.doSaveAndClose shouldn\'t happen') }
  close() :Promise<void> { throw new Error('HomePage.close shouldn\'t happen') }
  doNext() :Promise<void> { throw new Error('HomePage.doNext shouldn\'t happen') }
  selfUpdate() :Promise<void> { /*throw new Error('HomePage.selfUpdate shouldn\'t happen') - this gets called now? see GH issue #27 */ return Promise.resolve() }
  nextButtonText() { return null }
  currentName() { return this.style.briefTitle }
  shown() {}
  readonly ctx
  readonly el
  private constructor(ctx :GlobalContext, el :HTMLElement) { this.ctx = ctx; this.el = el }
  static async new(ctx :GlobalContext) {
    const homePage = new HomePage(ctx, <div class="p-2 p-sm-3"></div>)

    const logEdit = await new ListEditorWithTemp({
      parent: homePage, theStore: ctx.storage.samplingLogs, editorClass: SamplingLogEditor, editorStyle: SamplingLog.sStyle,
      title: tr('saved-pl')+' '+tr('Sampling Logs'), txtPlanned: tr('planned-pl')+' '+tr('Sampling Logs'),
      dialogTitle: tr('new-log-from-proc'), templateSource: async () => (await ctx.storage.samplingProcedures.getAll(null)).map(([_,t])=>t),
      planned: null }).initialize()
    logEdit.highlightButton('temp')

    const procEdit = await new ListEditor({
      parent: homePage, theStore: ctx.storage.samplingProcedures, editorClass: SamplingProcedureEditor, editorStyle: SamplingProcedure.sStyle,
      title: tr('Sampling Procedures') }).initialize()

    const inpExp = new ImportExportTool(ctx)
    inpExp.el.addEventListener(CustomStoreEvent.NAME, () => {
      // inform the list editors of the import so they update themselves
      logEdit.el.dispatchEvent(new CustomStoreEvent({ action: 'upd', id: null }))
      procEdit.el.dispatchEvent(new CustomStoreEvent({ action: 'upd', id: null }))
    })
    modifyLogEditButtons(logEdit, inpExp)
    modifyProcEditButtons(procEdit, inpExp)

    const settings = await makeSettings(ctx)

    homePage.el.appendChild(<div class="accordion" id="homeAccordion">
      {makeAcc(ctx, 'accSampLog', <strong><i class={`bi-${SamplingLog.sStyle.icon} me-1`}/>{tr('Sampling Logs')}</strong>, logEdit.el, true)}
      {makeAcc(ctx, 'accLogTemp', <><i class={`bi-${SamplingProcedure.sStyle.icon} me-1`}/>{tr('Templates')} ({tr('Procedures')})</>, procEdit.el)}
      {makeAcc(ctx, 'accImpExp', tr('import-export'), inpExp.el)}
      {makeAcc(ctx, 'accSett', tr('Settings'), settings)}
    </div>)
    return homePage
  }
}

function modifyLogEditButtons(logEdit :ListEditorWithTemp<SamplingProcedure, SamplingLog>, inpExp :ImportExportTool) {
  const btnExport = safeCastElement(HTMLButtonElement,
    <button type="button" class="btn btn-outline-success text-nowrap" title={tr('Export')+' '+tr('export-as-zip')}
      data-test-id="export-log-as-zip"><i class="bi-file-earmark-zip"/><i class="bi-share-fill"/> {tr('Export')}</button>)
  logEdit.registerButton(btnExport, s => inpExp.exportAsZip(s))
  logEdit.addToButtons(btnExport)

  const btnDel = logEdit.popButton('del')
  btnDel.classList.add('dropdown-item','text-danger')

  const btnNew = logEdit.popButton('new')
  btnNew.classList.add('dropdown-item','text-info')

  const btnJson = safeCastElement(HTMLButtonElement,
    <button type="button" class="dropdown-item" disabled>
      <i class="bi-file-earmark-medical text-success"/><i class="bi-share-fill text-success"/> {tr('Export')+' '+tr('export-as-json')}</button>)
  logEdit.registerButton(btnJson, s => inpExp.exportAsJson(s))

  const btnCsv = safeCastElement(HTMLButtonElement,
    <button type="button" class="dropdown-item" disabled>
      <i class="bi-file-earmark-spreadsheet text-warning"/><i class="bi-share-fill text-warning"/> {tr('Export')+' '+tr('export-as-csv')}</button>)
  logEdit.registerButton(btnCsv, s => inpExp.exportAsCsv(s))

  const btnMore = safeCastElement(HTMLButtonElement,
    <button type="button" class="btn btn-outline-primary dropdown-toggle text-nowrap"
      data-bs-toggle="dropdown" aria-expanded="false">{tr('More')}</button>)
  const divMore = safeCastElement(HTMLDivElement, <div class="dropdown"> {btnMore}
    <ul class="dropdown-menu">
      <li>{btnJson}</li>
      <li>{btnCsv}</li>
      <li><hr class="dropdown-divider"/></li>
      <li>{btnNew}</li>
      <li><hr class="dropdown-divider"/></li>
      <li>{btnDel}</li>
    </ul>
  </div>)
  logEdit.addToButtons(divMore)
}

function modifyProcEditButtons(procEdit :ListEditor<SamplingProcedure>, inpExp :ImportExportTool) {
  const btnExport = safeCastElement(HTMLButtonElement,
    <button type="button" class="btn btn-outline-success text-nowrap" title={tr('Export')+' '+tr('export-as-json')}>
      <i class="bi-filetype-json"/><i class="bi-share-fill"/> {tr('Export')}</button>)
  procEdit.registerButton(btnExport, s => inpExp.exportAsJson(s))
  procEdit.addToButtons(btnExport)

  const btnDel = procEdit.popButton('del')
  btnDel.classList.add('dropdown-item','text-danger')

  const btnMore = safeCastElement(HTMLButtonElement,
    <button type="button" class="btn btn-outline-primary dropdown-toggle text-nowrap"
      data-bs-toggle="dropdown" aria-expanded="false">{tr('More')}</button>)
  const divMore = safeCastElement(HTMLDivElement, <div class="dropdown"> {btnMore}
    <ul class="dropdown-menu">
      <li>{btnDel}</li>
    </ul>
  </div>)
  procEdit.addToButtons(divMore)
}
