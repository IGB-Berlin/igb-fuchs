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
import { jsx, jsxFragment } from '@haukex/simple-jsx-dom'
import { HasHtmlSummary } from './types/common'
import { GlobalContext } from './main'
import { modalDialog } from './dialog'
import { tr } from './i18n'

export async function noStorageAlert() :Promise<never> {
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  while(true) await modalDialog<void>({
    headerColor: 'bg-danger',
    titleIcon: 'exclamation-triangle-fill',
    title: tr('Error: No Storage Available'),
    body: tr('alert-no-storage-text'),
    buttons: [],
    hiddenCallback: resolve => resolve(),
  })
}

type UnsavedChangesResponse = 'save'|'discard'|'cancel'
export function unsavedChangesQuestion(saveBtnLabel :string, details :HTMLElement|string) :Promise<UnsavedChangesResponse> {
  let result :UnsavedChangesResponse = 'cancel'
  return modalDialog({
    headerColor: 'bg-warning',
    titleIcon: 'exclamation-triangle-fill',
    title: tr('Unsaved Changes'),
    body: <>
      <p><strong>{tr('unsaved-changes')}</strong></p>
      { details instanceof Node ? details : <p>{details}</p> }
      <p class="mt-3 mb-0 fw-bold text-warning">{tr('cannot-undo-discard')}</p>
    </>,
    buttons: [
      <button class="btn-danger" onclick={()=>result='discard'}><i class="bi-trash3-fill"/> {tr('Discard')}</button>,
      <button class="btn-secondary"><i class="bi-x-lg"/> {tr('Cancel')}</button>,
      <button class="btn-success" onclick={()=>result='save'}><i class="bi-floppy-fill"/> {saveBtnLabel}</button>,
    ],
    hiddenCallback: resolve => resolve(result)
  })
}

type DeletionConfirmation = 'delete'|'cancel'
export function deleteConfirmation(desc :string|HTMLElement) :Promise<DeletionConfirmation> {
  let result :DeletionConfirmation = 'cancel'
  return modalDialog({
    headerColor: 'bg-warning',
    titleIcon: 'exclamation-triangle-fill',
    title: tr('Confirm Deletion'),
    body: <>
      <p><strong>{tr('confirm-delete')}</strong></p>
      { desc ? <p>{desc}</p> : '' }
      <p class="mb-0 fw-bold text-warning">{tr('cannot-undo-delete')}</p>
    </>,
    buttons: [
      <button class="btn-danger" onclick={()=>result='delete'}><i class="bi-trash3-fill"/> {tr('Delete')}</button>,
      <button class="btn-secondary"><i class="bi-x-lg"/> {tr('Cancel')}</button>,
    ],
    hiddenCallback: resolve => resolve(result)
  })
}

/** For use during data import as the contents of a yesNoDialog */
export function importOverwriteQuestion(have :HasHtmlSummary, imp :HasHtmlSummary) :HTMLElement {
  const h = have.summaryAsHtml(true)  // we know this is a flex-row div
  h.classList.add('mb-3')
  h.insertAdjacentElement('afterbegin',
    <div class="fw-semibold text-success-emphasis">{tr('Existing object')}:</div>)
  const i = imp.summaryAsHtml(true)
  i.insertAdjacentElement('afterbegin',
    <div class="fw-semibold text-warning-emphasis">{tr('Imported object')}:</div>)
  return <div>
    <p class="fw-bold text-danger-emphasis">{tr('import-overwrite')}</p>
    {h} {i} </div>
}

type OverAppendResult = 'overwrite'|'append'|'cancel'
export function overAppendDialog(title :string, body :string|HTMLElement) :Promise<OverAppendResult> {
  let result :OverAppendResult = 'cancel'
  return modalDialog({
    size: 'lg',
    headerColor: 'info',
    titleIcon: 'question-circle-fill',
    title: title,
    body: body instanceof Node ? body : <p><strong>{body}</strong></p>,
    buttons: [
      <button class="btn-secondary" onclick={()=>result='cancel'}><i class="bi-trash3-fill"/> {tr('Cancel')}</button>,
      <button class="btn-info" onclick={()=>result='append'}><i class="bi-file-earmark-plus"/> {tr('Append')}</button>,
      <button class="btn-danger" onclick={()=>result='overwrite'}><i class="bi-file-earmark-arrow-down"/> {tr('Overwrite')}</button>,
    ],
    hiddenCallback: resolve => resolve(result)
  })
}

type YesNoResult = 'yes'|'no'|'cancel'
export function yesNoDialog(question :string|HTMLElement, title :string, cancel :false, yesIsGood :boolean) :Promise<'yes'|'no'>
export function yesNoDialog(question :string|HTMLElement, title :string, cancel :true, yesIsGood :boolean) :Promise<YesNoResult>
export function yesNoDialog(question :string|HTMLElement, title :string, cancel :boolean, yesIsGood :boolean = false) :Promise<YesNoResult> {
  let result :YesNoResult = cancel ? 'cancel' : 'no'
  const buttons = [
    <button class={yesIsGood?'btn-success':'btn-warning'} onclick={()=>result='yes'}><i class="bi-check-circle"/> {tr('Yes')}</button>,
    <button class={yesIsGood?'btn-warning':'btn-success'} onclick={()=>result='no'}><i class="bi-x-square"/> {tr('No')}</button> ]
  if (cancel) buttons.push(
    <button class="btn-secondary" onclick={()=>result='cancel'}><i class="bi-x-lg"/> {tr('Cancel')}</button>)
  return modalDialog({
    size: 'lg',
    headerColor: 'info',
    titleIcon: 'question-circle-fill',
    title: title,
    body: question instanceof Node ? question : <p><strong>{question}</strong></p>,
    buttons: buttons,
    hiddenCallback: resolve => resolve(result)
  })
}

export function internalErrorDialog(event :ErrorEvent|PromiseRejectionEvent) :Promise<void> {
  const content = event instanceof ErrorEvent ? <pre>{event.filename}:{event.lineno}:{event.colno}: {event.message}</pre> : <pre>{String(event.reason)}</pre>
  return infoDialog('error', tr('Error'), <><p>{tr('internal-error')}</p>{content}</>)
}

type InfoDialogType = 'info'|'warning'|'error'
export function infoDialog(type :InfoDialogType, title :string, body :string|HTMLElement) :Promise<void> {
  return modalDialog({
    size: 'lg',
    headerColor: type==='info' ? 'info' : type==='warning' ? 'bg-warning' : 'bg-danger',
    titleIcon: type==='info' ? 'info-circle' : type==='warning' ? 'exclamation-triangle-fill' : 'x-octagon-fill',
    title: title,
    body: body,
    buttons: [ <button class="btn-primary"><i class="bi-check-lg"/> {tr('Understood')}</button> ],
    hiddenCallback: resolve => resolve(),
  })
}

export async function betaWarning(ctx :GlobalContext, force :boolean = false) :Promise<void> {
  const hideUntilMs = await ctx.storage.settings.get('hideBetaWarningUntilTimeMs')
  if (!force && Number.isFinite(hideUntilMs) && Date.now()<hideUntilMs)
    return
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  await modalDialog<void>({
    testId: 'betaWarningDialog',
    headerColor: 'bg-warning',
    titleIcon: 'exclamation-triangle-fill',
    title: tr('beta-warning-title'),
    body: <p class="fw-bold text-warning-emphasis">{tr('beta-warning-text')}</p>,
    buttons: [ <button class="btn-outline-warning"><i class="bi-exclamation-triangle"/> {tr('beta-warning-dismiss')}</button> ],
    hiddenCallback: resolve => resolve(),
  })
  await ctx.storage.settings.set('hideBetaWarningUntilTimeMs', Date.now() + 1000*60*60*24*30)
}
export function makeBetaVersionNoticeLink(ctx :GlobalContext) :HTMLElement {
  const a = <a href="#" class="ms-3 link-warning">{tr('beta-warning-title')}</a>
  a.addEventListener('click', async event => {
    event.preventDefault()
    await betaWarning(ctx, true)
  })
  return a
}
