/** This file is part of IGB-FUCHS.
 *
 * WTW® is a registered trademark of Xylem Analytics Germany GmbH.
 * This project is not affiliated with, endorsed by, or sponsored by Xylem or its subsidiaries.
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
import { WtwParseResults, WtwReceiver } from './wtw-parse'
import { jsx, safeCastElement } from './jsx-dom'
import { assert } from './utils'
import { tr } from './i18n'

type State = 'not-available'|'disconnected'|'connecting'|'connected'|'disconnecting'

export class WtwStateChangeEvent extends CustomEvent<{ from :State, to :State }> {
  static readonly NAME = 'custom.wtw.state-change'
  constructor(from :State, to :State) {
    super(WtwStateChangeEvent.NAME, { detail: { from: from, to :to }, bubbles: false, cancelable: false })
  }
}

export class WtwDataReceivedEvent extends CustomEvent<{ results :WtwParseResults[] }> {
  static readonly NAME = 'custom.wtw.data-rx'
  constructor(results :WtwParseResults[]) {
    super(WtwDataReceivedEvent.NAME, { detail: { results: results }, bubbles: false, cancelable: false })
  }
}

export class WtwConnector extends EventTarget {

  // singleton!
  private constructor() { super() }
  static readonly instance = new WtwConnector()

  private readonly rx = new WtwReceiver()

  private _state :State = 'serial' in navigator ? 'disconnected' : 'not-available'
  get state() { return this._state }
  private set state(newState :State) {
    console.debug('WTW', newState)
    const oldState = this._state
    this._state = newState
    this.dispatchEvent(new WtwStateChangeEvent(oldState, newState))
  }

  private closeHandler :(()=>Promise<void>)|null = null

  async disconnect() {
    if (this.state != 'connected') throw new Error(`unexpected disconnect in state ${this.state}`)
    if (!this.closeHandler) throw new Error('bad state: closeHandler should be set')
    await this.closeHandler()
  }

  async connect() {
    if (this.state != 'disconnected') throw new Error(`unexpected connect in state ${this.state}`)
    if (this.closeHandler) throw new Error('bad state: closeHandler should not be set')
    this.state = 'connecting'

    /* Please note this code is heavily based on my code here:
     * https://github.com/haukex/web-serial/blob/main/src/serial.tsx */

    let port :SerialPort|null = null
    try { port = await navigator.serial.requestPort() }
    catch (ex) {
      if (ex instanceof DOMException && ex.name === 'NotFoundError') {/* user canceled, ignore */}
      else if (ex instanceof DOMException && ex.name === 'SecurityError')
        alert(`${tr('wtw-access-denied')} (${String(ex)})`)
      else alert(`${tr('wtw-failed-open')} (${String(ex)})`)
    }
    if (!port) {
      this.state = 'disconnected'
      return
    }
    try { await port.open({ baudRate: 4800, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' }) }
    catch (ex) {
      alert(`${tr('wtw-failed-open')} (${String(ex)})`)
      this.state = 'disconnected'
      return
    }

    let keepReading = true as boolean
    let textReader :ReadableStreamDefaultReader<string>

    const readTextLoop = async () => {
      try {
        while (true) {
          let rv :ReadableStreamReadResult<string>
          try { rv = await textReader.read() }
          catch (ex) { console.warn('WTW: Breaking readTextLoop because', ex); break }
          if (rv.value!=undefined) {
            const res = this.rx.add(rv.value)
            if (res.length) this.dispatchEvent(new WtwDataReceivedEvent(res))
          }
          if (rv.done) break
        }
      } finally { textReader.releaseLock() }
    }

    const readUntilClosed = (async () => {
      while (port.readable && keepReading) {
        const textDecoder = new TextDecoderStream('cp1252', { fatal: false, ignoreBOM: false })
        const txtClosed = port.readable.pipeTo(textDecoder.writable as WritableStream<Uint8Array>)
        textReader = textDecoder.readable.getReader()
        await Promise.all([ readTextLoop(), txtClosed.catch(() => {/* ignore */}) ])
      }
      if (keepReading) {  // user didn't disconnect, so the device must have
        keepReading = false  // ensure there aren't any recursive calls (shouldn't be; just in case)
        if (this.closeHandler) setTimeout(this.closeHandler)  // don't await to prevent deadlock
      }
      await port.close()
    })()

    this.closeHandler = async () => {
      this.state = 'disconnecting'
      keepReading = false
      try { await textReader.cancel() } catch (_) {/* ignore */}
      await readUntilClosed
      this.closeHandler = null
      this.rx.clear()
      this.state = 'disconnected'
    }
    this.state = 'connected'

  }
}

export class WtwConnControl extends HTMLElement {

  private readonly btnConnect :HTMLButtonElement
  private readonly elStatus :HTMLElement
  constructor() {
    super()
    this.btnConnect = safeCastElement(HTMLButtonElement, <button class="btn" disabled></button>)
    this.btnConnect.addEventListener('click', async event => {
      event.preventDefault()
      if (WtwConnector.instance.state==='disconnected') await WtwConnector.instance.connect()
      else if (WtwConnector.instance.state==='connected') await WtwConnector.instance.disconnect()
    })
    this.appendChild(this.btnConnect)
    this.elStatus = <span class="ms-3"></span>
    this.appendChild(this.elStatus)
  }

  private updateState(state :State) {
    this.btnConnect.classList.remove('btn-success','btn-danger','btn-outline-danger','btn-outline-success')
    this.elStatus.replaceChildren()
    switch (state) {
      case 'not-available':
        this.btnConnect.classList.add('btn-outline-secondary')
        this.btnConnect.replaceChildren(<span><i class="bi-exclamation-octagon me-1"/> {tr('Not available')}</span>)
        this.btnConnect.disabled = true
        break
      case 'disconnected':
        this.btnConnect.disabled = false
        this.btnConnect.classList.add('btn-success')
        this.btnConnect.replaceChildren(<span><i class="bi-plug me-1"/> {tr('Connect')}</span>)
        this.elStatus.replaceChildren(<span class="text-danger"><i class="bi-x-lg"/> {tr('Disconnected')}</span>)
        break
      case 'connecting':
        this.btnConnect.classList.add('btn-outline-success')
        this.btnConnect.replaceChildren(
          <span><span class="spinner-border spinner-border-sm" aria-hidden="true"></span> {tr('Connecting')}...</span>)
        this.btnConnect.disabled = true
        break
      case 'connected':
        this.btnConnect.disabled = false
        this.btnConnect.classList.add('btn-danger')
        this.btnConnect.replaceChildren(<span><i class="bi-x-octagon me-1"/> {tr('Disconnect')}</span>)
        this.elStatus.replaceChildren(<span class="text-success"><i class="bi-check-lg"/> {tr('Connected')}</span>)
        break
      case 'disconnecting':
        this.btnConnect.classList.add('btn-outline-danger')
        this.btnConnect.replaceChildren(
          <span><span class="spinner-border spinner-border-sm" aria-hidden="true"></span> {tr('Disconnecting')}...</span>)
        this.btnConnect.disabled = true
        break
    }
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#custom_element_lifecycle_callbacks
  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#signal
  private abortController :AbortController|null = null
  connectedCallback() {
    if (this.abortController) this.abortController.abort()
    this.abortController = new AbortController()
    WtwConnector.instance.addEventListener(WtwStateChangeEvent.NAME, event => {
      assert(event instanceof WtwStateChangeEvent)
      this.updateState(event.detail.to)
    }, { signal: this.abortController.signal })
    this.updateState(WtwConnector.instance.state)
    // we'll just bubble this event to ourselves, to simplify it for our users
    WtwConnector.instance.addEventListener(WtwDataReceivedEvent.NAME, event => {
      assert(event instanceof WtwDataReceivedEvent)
      this.dispatchEvent(new WtwDataReceivedEvent(event.detail.results))
    }, { signal: this.abortController.signal })
  }
  disconnectedCallback() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }
  static readonly NAME = 'igb-fuchs-wtw-control-element'
}
customElements.define(WtwConnControl.NAME, WtwConnControl)
