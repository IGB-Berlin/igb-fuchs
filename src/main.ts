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
import { EditorStack } from './editors/stack'
import { IndexedStorage } from './storage'
import * as misc from './dialogs'
import { assert } from './utils'

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

export class GlobalContext {
  readonly storage :IndexedStorage
  constructor(storage :IndexedStorage) {
    this.storage = storage
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  setTheme()
  const storage = await IndexedStorage.open()
  if (!await storage.selfTest()) {
    misc.noStorageAlert()
    throw new Error('Storage not available, can\'t continue')
  }
  const ctx = new GlobalContext(storage)
  const htmlMain = document.querySelector('main')
  const navbarMain = document.getElementById('navbarMain')
  const igbLogo = document.getElementById('igbLogo')
  assert(htmlMain instanceof HTMLElement && navbarMain instanceof HTMLDivElement && igbLogo instanceof HTMLElement)
  igbLogo.addEventListener('click', event => event.preventDefault())  // about dialog is triggered from HTML via Bootstrap
  const editorStack = EditorStack.makeStack(ctx, navbarMain)
  htmlMain.appendChild(editorStack.el)
})

/* TODO Later: Sharing
import * as share from './share'
export async function test() {
  dummy.appendChild(<button onclick={async () => await share.shareCsv('test.csv', new ArrayBuffer(0))}>Share Test</button>)
  dummy.appendChild(<button onclick={async () => await share.downloadCsv('test.csv', new ArrayBuffer(0))}>Download</button>)
}*/
