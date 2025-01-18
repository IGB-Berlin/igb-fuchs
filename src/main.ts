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

const GIT_COMMIT_RAW = '$Commit$'  // is updated by git filters
const GIT_COMMIT = GIT_COMMIT_RAW.indexOf(' ')<0 || GIT_COMMIT_RAW.lastIndexOf(' ')<0 || GIT_COMMIT_RAW.lastIndexOf(' ')<=GIT_COMMIT_RAW.indexOf(' ')
  ? '?' : GIT_COMMIT_RAW.substring(GIT_COMMIT_RAW.indexOf(' ')+1, GIT_COMMIT_RAW.lastIndexOf(' '))

// GitHub pages doesn't automatically redirect to HTTPS, but we need it for certain JS APIs to work (e.g. crypto)
if (location.protocol.toLowerCase() === 'http:' && location.hostname.toLowerCase() !== 'localhost')
  location.replace( 'https:' + location.href.substring(location.protocol.length) )

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
  private readonly header
  readonly stack
  constructor(storage :IdbStorage, header :HTMLElement, stack :EditorStack) {
    this.storage = storage
    this.header = header
    this.stack = stack
  }
  scrollTo(target :HTMLElement) {
    target.style.setProperty('scroll-margin-top', `${this.header.getBoundingClientRect().height+5}px`)
    target.style.setProperty('scroll-margin-bottom', '5px')
    setTimeout(() => target.scrollIntoView({ block: 'nearest', behavior: 'smooth' })) // don't scroll until rendered
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  let storage :IdbStorage
  try { storage = await IdbStorage.open() }
  catch (ex) {
    console.error(ex)
    noStorageAlert()
    return
  }

  const igbLogo = document.getElementById('igbLogo')
  assert(igbLogo instanceof HTMLElement)
  igbLogo.addEventListener('click', event => event.preventDefault())  // about dialog is triggered from HTML via Bootstrap

  initI18n()

  const htmlHeader = document.querySelector('header')
  const htmlMain = document.querySelector('main')
  const navbarMain = document.getElementById('navbarMain')
  assert(htmlHeader instanceof HTMLElement && htmlMain instanceof HTMLElement && navbarMain instanceof HTMLDivElement)

  const ctx = new GlobalContext(storage, htmlHeader, new EditorStack())
  ctx.stack.initialize(navbarMain, makeHomePage(ctx))
  htmlMain.appendChild(ctx.stack.el)

  const licensesText = document.getElementById('licensesText')
  assert(licensesText instanceof HTMLElement)
  licensesText.innerText = licenses_txt.trim()

  const appVersion = document.getElementById('appVersion')
  assert(appVersion instanceof HTMLElement)
  appVersion.innerText = ( process.env['npm_package_version'] ?? '(unknown)' ) + ` (${GIT_COMMIT})`
  appVersion.insertAdjacentElement('afterend', makeBetaVersionNoticeLink(ctx))

  await betaWarning(ctx)
})
