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
import { betaWarning, internalErrorDialog, makeBetaVersionNoticeLink, noStorageAlert } from './dialogs'
import licenses_txt from 'bundle-text:../licenses.txt'
import { makeHomePage } from './editors/home'
import { EditorStack } from './editors/stack'
import { IdbStorage } from './idb-store'
import { initI18n } from './i18n'
import { assert } from './utils'

window.addEventListener('error', internalErrorDialog)
window.addEventListener('unhandledrejection', internalErrorDialog)

//TODO: Can we redirect from http to https version here?

if (module.hot) module.hot.accept()  // for the parcel development environment

// register the Service Worker (if possible)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(new URL('../worker/service-worker.ts', import.meta.url), {type: 'module', scope: '/'}).then(
    registration => console.debug('SW register ok', registration),
    (error :unknown) => console.error('Service Worker registration failed', error),
  )
  navigator.serviceWorker.addEventListener('message', event => console.debug('SW:', event.data))
} else console.warn('Service Workers are not supported')

// https://getbootstrap.com/docs/5.3/customize/color-modes/#javascript
const setTheme = () => document.documentElement.setAttribute('data-bs-theme',
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme)
window.addEventListener('DOMContentLoaded', setTheme)

export class GlobalContext {
  readonly storage
  readonly stack
  constructor(storage :IdbStorage, stack :EditorStack) {
    this.storage = storage
    this.stack = stack
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const storage = await IdbStorage.open()
  if (!await storage.selfTest()) {
    noStorageAlert()
    return
  }
  await storage.updateTemplates()  // need to call this once ourselves on start; will be called automatically on changes

  const igbLogo = document.getElementById('igbLogo')
  assert(igbLogo instanceof HTMLElement)
  igbLogo.addEventListener('click', event => event.preventDefault())  // about dialog is triggered from HTML via Bootstrap

  initI18n()

  const htmlMain = document.querySelector('main')
  const navbarMain = document.getElementById('navbarMain')
  assert(htmlMain instanceof HTMLElement && navbarMain instanceof HTMLDivElement)

  const ctx = new GlobalContext(storage, new EditorStack())
  ctx.stack.initialize(navbarMain, makeHomePage(ctx))
  htmlMain.appendChild(ctx.stack.el)

  const licensesText = document.getElementById('licensesText')
  assert(licensesText instanceof HTMLElement)
  licensesText.innerText = licenses_txt.trim()

  const appVersion = document.getElementById('appVersion')
  assert(appVersion instanceof HTMLElement)
  appVersion.innerText = process.env['npm_package_version'] ?? '(unknown)'
  appVersion.insertAdjacentElement('afterend', makeBetaVersionNoticeLink(ctx))

  await betaWarning(ctx)
})
