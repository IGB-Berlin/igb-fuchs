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
import { EditorStack } from './editors/stack'
import { HomePage } from './editors/home'
import { IdbStorage } from './idb-store'
import { initI18n } from './i18n'
import { assert } from './utils'

window.addEventListener('error', internalErrorDialog)
window.addEventListener('unhandledrejection', internalErrorDialog)

const GIT_COMMIT = (c => {
  const first = c.indexOf(' ')
  const last = c.lastIndexOf(' ')
  return first<0 || last<0 || last<=first ? '?' : c.substring(first+1, last)
})('$Commit$')  // is updated by git filters

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
  readonly stack
  private readonly header
  private readonly footer
  private counter = 0
  constructor(storage :IdbStorage, header :HTMLElement, footer :HTMLElement, stack :EditorStack) {
    this.storage = storage
    this.stack = stack
    this.header = header
    this.footer = footer
  }
  scrollTo(target :HTMLElement) {
    setTimeout(() => {  // don't scroll until rendered
      target.style.setProperty('scroll-margin-top',    `${this.header.getBoundingClientRect().height+5}px`)
      target.style.setProperty('scroll-margin-bottom', `${this.footer.getBoundingClientRect().height+5}px`)
      // It seems to me that `auto` behavior depends on `prefers-reduced-motion`, which is good for tests
      target.scrollIntoView({ block: 'center', behavior: 'auto' })
    }, 1)  // I think this should ensure we fire after any other `setTimeout(..., 0)`s
  }
  genId(name ?:string|null) { return `_gen${name?.trim().length ? '_'+name : ''}_${this.counter++}_` }
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
  const htmlFooter = document.querySelector('footer')
  const htmlMain = document.querySelector('main')
  const navbarMain = document.getElementById('navbarMain')
  assert(htmlHeader instanceof HTMLElement && htmlFooter instanceof HTMLElement && htmlMain instanceof HTMLElement && navbarMain instanceof HTMLDivElement)

  const ctx = new GlobalContext(storage, htmlHeader, htmlFooter, new EditorStack(htmlFooter))
  ctx.stack.initialize(navbarMain, await HomePage.new(ctx))
  htmlMain.appendChild(ctx.stack.el)

  const licensesText = document.getElementById('licensesText')
  assert(licensesText instanceof HTMLElement)
  licensesText.innerText = licenses_txt.trim()

  const appVersion = document.getElementById('appVersion')
  const versionBadge = document.getElementById('versionBadge')
  assert(appVersion instanceof HTMLElement && versionBadge instanceof HTMLElement)
  appVersion.innerText = ( process.env['npm_package_version'] ?? '(unknown)' ) + ` (${GIT_COMMIT})`
  appVersion.insertAdjacentElement('afterend', makeBetaVersionNoticeLink(ctx))
  versionBadge.title = ( process.env['npm_package_version'] ?? '(unknown)' ) + ` (${GIT_COMMIT})`

  await betaWarning(ctx)
})
