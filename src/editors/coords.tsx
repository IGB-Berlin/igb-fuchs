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
import { areWgs84CoordsValid, RawWgs84Coordinates, WGS84_PRECISION, Wgs84Coordinates } from '../types/coords'
import { DataObjectBase, makeValidNumberPat } from '../types/common'
import { jsx, jsxFragment, safeCast } from '@haukex/simple-jsx-dom'
import { CustomChangeEvent, CustomAlertEvent } from '../events'
import { numericTextInputStuff } from '../utils'
import { Alert } from 'bootstrap'
import { Editor } from './base'
import { tr } from '../i18n'

const VALID_CLIPBOARD_COORD_RE = new RegExp(`^\\s*(${makeValidNumberPat()})\\s*,\\s*(${makeValidNumberPat()})\\s*$`)

interface CoordEditorOpts {
  readonly ?:boolean
  noGetBtn ?:boolean
}

export class CoordinatesEditor {
  readonly el :HTMLDivElement
  protected readonly coords
  readonly elGetCoords
  protected readonly inpLat
  protected readonly inpLon
  constructor(initCoords :RawWgs84Coordinates, opts :CoordEditorOpts = {}) {
    this.coords = new Wgs84Coordinates(initCoords).deepClone()

    this.inpLat = safeCast(HTMLInputElement,
      <input type="text" inputmode="decimal" pattern={makeValidNumberPat(WGS84_PRECISION)}
        value={ Number.isFinite(this.coords.wgs84lat) ? this.coords.wgs84lat.toFixed(WGS84_PRECISION) : '' }
        required={!opts.readonly} readonly={!!opts.readonly}
        class="form-control" placeholder={tr('Latitude')} aria-label={tr('Latitude')} title={tr('Latitude')} />)
    numericTextInputStuff(this.inpLat)

    this.inpLon = safeCast(HTMLInputElement,
      <input type="text" inputmode="decimal" pattern={makeValidNumberPat(WGS84_PRECISION)}
        value={ Number.isFinite(this.coords.wgs84lon) ? this.coords.wgs84lon.toFixed(WGS84_PRECISION) : '' }
        required={!opts.readonly} readonly={!!opts.readonly}
        class="form-control" placeholder={tr('Longitude')} aria-label={tr('Longitude')} title={tr('Longitude')} />)
    numericTextInputStuff(this.inpLon)

    const inpGrp = safeCast(HTMLDivElement, <div class="input-group">
      <span class="input-group-text d-none d-sm-flex" title={tr('Latitude')}>{tr('Lat')}</span> {this.inpLat}
      <span class="input-group-text d-none d-sm-flex" title={tr('Longitude')}>{tr('Lon')}</span> {this.inpLon}
      {this.makeMapButton(false)}
    </div>)
    this.el = safeCast(HTMLDivElement, <div>{inpGrp}</div>)

    this.inpLat.addEventListener('change', () => {
      this.coords.wgs84lat = Number.parseFloat(this.inpLat.value)
      this.el.dispatchEvent(new CustomChangeEvent())
    })
    this.inpLon.addEventListener('change', () => {
      this.coords.wgs84lon = Number.parseFloat(this.inpLon.value)
      this.el.dispatchEvent(new CustomChangeEvent())
    })

    const fireAlert = () => this.el.dispatchEvent(new CustomAlertEvent())
    // bubble events from form validation:
    this.inpLat.addEventListener('invalid', fireAlert)
    this.inpLon.addEventListener('invalid', fireAlert)

    /* ***** Clipboard Handler ***** */
    if (!opts.readonly) {
      const pasteHandler = (event :ClipboardEvent) => {
        const txt = event.clipboardData?.getData('text/plain')
        if (txt) {
          const m = txt.match(VALID_CLIPBOARD_COORD_RE)
          if (m) {
            const lat = Number.parseFloat(m[1] ?? '')
            const lon = Number.parseFloat(m[2] ?? '')
            if (Number.isFinite(lat) && Number.isFinite(lon)) {
              console.debug('Parsed clipboard', txt, 'to', lat, lon)
              this.setCoords(lat, lon)
              event.preventDefault()
              event.stopPropagation()
            }
          }
        }
      }
      this.inpLat.addEventListener('paste', pasteHandler)
      this.inpLon.addEventListener('paste', pasteHandler)
    }

    /* ***** "Get Coordinates" Dropdown Button ***** */
    const coordIcon = opts.noGetBtn
      ? <span><i class="bi-crosshair"/><span class="mx-1"> {tr('Location')}</span></span>
      : <span><i class="bi-crosshair"/><span class="visually-hidden"> {tr('Coordinates')}</span></span>
    const spinIcon = opts.noGetBtn
      ? <div class="d-inline"><div class="spinner-border spinner-border-sm" role="status"/><span class="ms-1"> {tr('Please wait')}</span> </div>
      : <div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden"> {tr('Please wait')}</span> </div>
    const btnCoordsDrop = <button type="button" class="btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"
      disabled={!!opts.readonly} title={tr( opts.noGetBtn ? 'Location' : 'Coordinates' )}>{coordIcon}</button>
    btnCoordsDrop.classList.add( opts.readonly ? 'btn-outline-secondary' : 'btn-outline-primary' )

    const btnGetCoords = <button type="button" class="dropdown-item">{tr('Use current location')}</button>
    const dropdownMenu = <ul class="dropdown-menu">{btnGetCoords}</ul>
    if (!opts.noGetBtn) {
      inpGrp.insertBefore(dropdownMenu, inpGrp.firstChild)
      inpGrp.insertBefore(btnCoordsDrop, dropdownMenu)
      this.elGetCoords = <></>
    }
    else this.elGetCoords = <>{btnCoordsDrop}{dropdownMenu}</>

    let curAlert :Alert|null = null
    btnGetCoords.addEventListener('click', () => {
      if (opts.readonly) throw new Error('The control should be readonly, how was the button clicked?')
      setTimeout(()=>{  // if we were to immediately disable the button, the dropdown wouldn't auto-hide
        btnCoordsDrop.setAttribute('disabled', 'disabled')
        btnCoordsDrop.replaceChildren(spinIcon)
        const reenable = () => {
          btnCoordsDrop.removeAttribute('disabled')
          btnCoordsDrop.replaceChildren(coordIcon)
        }
        navigator.geolocation.getCurrentPosition(pos => {
          reenable()
          this.setCoords(pos.coords.latitude, pos.coords.longitude)
        }, err => {
          reenable()
          console.log('Failed to get current position', err)
          if (curAlert) { curAlert.close(); curAlert = null }
          const alertDiv = <div class="alert alert-warning alert-dismissible fade show mt-1" role="alert">
            <i class="bi-exclamation-triangle-fill"/> { tr( err.code===err.PERMISSION_DENIED ? 'geo-permission-denied'
              : err.code===err.POSITION_UNAVAILABLE ? 'geo-unavailable'
                : err.code===err.TIMEOUT ? 'geo-timeout'
                  : 'geo-unknown-error' )}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
          this.el.appendChild(alertDiv)
          const bsAlert = Alert.getOrCreateInstance(alertDiv)
          alertDiv.addEventListener('close.bs.alert', () => { if (curAlert===bsAlert) curAlert=null })
          alertDiv.addEventListener('closed.bs.alert', () => bsAlert.dispose() )
          fireAlert()
          curAlert = bsAlert
        }, { maximumAge: 1000*30, timeout: 1000*10, enableHighAccuracy: true })
      })
    })
  }

  makeMapButton(withText :boolean) {
    const btnMap = safeCast(HTMLButtonElement,
      <button class="btn btn-outline-primary" title={tr('Show on map')}><i class="bi-pin-map"/></button>)
    btnMap.appendChild( withText
      ? <span class="ms-1">{tr('Map')}</span> : <span class="visually-hidden"> {tr('Show on map')}</span> )
    btnMap.addEventListener('click', event => {
      event.preventDefault()  // prevent form submission
      if (areWgs84CoordsValid(this.coords))
        // see also GH issue #37 about opening coords in *any* navigation app on mobile
        //mapLink.href = `https://www.google.com/maps/place/${coord.wgs84lat.toFixed(WGS84_PRECISION)},${coord.wgs84lon.toFixed(WGS84_PRECISION)}`
        // https://developers.google.com/maps/documentation/urls/get-started#search-action
        window.open('https://www.google.com/maps/search/?api=1&'
          +`query=${this.coords.wgs84lat.toFixed(WGS84_PRECISION)},${this.coords.wgs84lon.toFixed(WGS84_PRECISION)}`)
    })
    const updateBtnMap = () => {
      if (areWgs84CoordsValid(this.coords))
        btnMap.removeAttribute('disabled')
      else
        btnMap.setAttribute('disabled','disabled')
    }
    setTimeout(() =>  // delay because this.el may not be set yet
      this.el.addEventListener(CustomChangeEvent.NAME, updateBtnMap) )
    updateBtnMap()
    return btnMap
  }

  setCoords(lat :number, lon :number) {
    this.coords.wgs84lat = lat
    this.coords.wgs84lon = lon
    this.inpLat.value = lat.toFixed(WGS84_PRECISION)
    this.inpLon.value = lon.toFixed(WGS84_PRECISION)
    this.el.dispatchEvent(new CustomChangeEvent())
  }

  /** Get a *copy* of the coordinates being edited by this editor. */
  getCoords() { return this.coords.deepClone() }

  isValid() { return areWgs84CoordsValid(this.coords) }
}

export class SuperCoordEditor<B extends DataObjectBase<B>> {
  readonly el
  private readonly edActCoords
  constructor(parent :Editor<B>, nomCoords :RawWgs84Coordinates, actCoords :RawWgs84Coordinates) {

    const edNomCoords = new CoordinatesEditor(nomCoords, { readonly: true, noGetBtn: true })
    this.edActCoords = new CoordinatesEditor(actCoords, { readonly: false, noGetBtn: true })
    const btnUseCurrent = this.edActCoords.elGetCoords
    const btnShowMap = areWgs84CoordsValid(nomCoords) ? edNomCoords.makeMapButton(true) : this.edActCoords.makeMapButton(true)
    this.edActCoords.el.addEventListener(CustomChangeEvent.NAME, () => this.el.dispatchEvent(new CustomChangeEvent()))  // bubble
    edNomCoords.el.setAttribute('data-test-id','nomCoords')
    this.edActCoords.el.setAttribute('data-test-id','actCoords')

    const rowNom = parent.makeRow(edNomCoords.el, {
      label: tr('nom-coord'), helpText: <>{tr('nom-coord-help')} {tr('temp-copied-readonly')} {tr('coord-ref')}</> })
    const rowAct = parent.makeRow(this.edActCoords.el, { label: tr('act-coord'), invalidText: tr('invalid-coords'),
      helpText: <><strong>{tr('Required')}.</strong> {tr('act-coord-help')} {tr('coord-help')} {tr('dot-minus-hack')} {tr('coord-ref')}</> })
    rowAct.classList.remove('mb-2','mb-sm-3')
    if (!areWgs84CoordsValid(nomCoords))
      rowNom.classList.add('d-none')

    const accTitle = <div class="input-group" data-bs-toggle="collapse" data-bs-target>{btnUseCurrent}{btnShowMap}</div>
    const [acc, coll] = parent.makeAccordion({ label: tr('Coordinates'),
      title: accTitle, rows: [rowNom, rowAct], testId: 'coord-accord' })
    this.el = acc

    setTimeout(() => {  // needs to be deferred because the Elements need to be in the DOM
      if (!areWgs84CoordsValid(actCoords))
        coll().show()
      this.edActCoords.el.addEventListener(CustomAlertEvent.NAME, () => coll().show())
    })

  }
  getActCoords() { return this.edActCoords.getCoords() }
  isActValid() { return this.edActCoords.isValid() }
}
