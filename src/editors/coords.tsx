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
import { areWgs84CoordsValid, EMPTY_COORDS, RawWgs84Coordinates, WGS84_PRECISION, Wgs84Coordinates } from '../types/coords'
import { jsx, jsxFragment, safeCastElement } from '../jsx-dom'
import { makeValidNumberPat } from '../types/common'
import { numericTextInputStuff } from '../utils'
import { CustomChangeEvent } from '../events'
import { Alert } from 'bootstrap'
import { tr } from '../i18n'

const _pat = makeValidNumberPat()
const VALID_CLIPBOARD_COORD_RE = new RegExp(`^\\s*(${_pat})\\s*,\\s*(${_pat})\\s*$`)

export class CoordinatesEditor {
  readonly el :HTMLDivElement
  protected readonly coords
  readonly mapLink
  readonly btnCoords
  protected readonly inpLat
  protected readonly inpLon
  constructor(initCoords :RawWgs84Coordinates = EMPTY_COORDS, readonly :boolean = false) {
    this.coords = new Wgs84Coordinates(initCoords).deepClone()

    this.inpLat = safeCastElement(HTMLInputElement,
      <input type="text" inputmode="decimal" pattern={makeValidNumberPat(WGS84_PRECISION)}
        value={ Number.isFinite(this.coords.wgs84lat) ? this.coords.wgs84lat.toFixed(WGS84_PRECISION) : '' }
        required={!readonly} readonly={readonly}
        class="form-control" placeholder={tr('Latitude')} aria-label={tr('Latitude')} title={tr('Latitude')} />)
    numericTextInputStuff(this.inpLat)

    this.inpLon = safeCastElement(HTMLInputElement,
      <input type="text" inputmode="decimal" pattern={makeValidNumberPat(WGS84_PRECISION)}
        value={ Number.isFinite(this.coords.wgs84lon) ? this.coords.wgs84lon.toFixed(WGS84_PRECISION) : '' }
        required={!readonly} readonly={readonly}
        class="form-control" placeholder={tr('Longitude')} aria-label={tr('Longitude')} title={tr('Longitude')} />)
    numericTextInputStuff(this.inpLon)

    this.el = safeCastElement(HTMLDivElement, <div class="input-group">
      <span class="input-group-text d-none d-sm-flex" title={tr('Latitude')}>{tr('Lat')}</span> {this.inpLat}
      <span class="input-group-text d-none d-sm-flex" title={tr('Longitude')}>{tr('Lon')}</span> {this.inpLon}
    </div>)

    this.inpLat.addEventListener('change', () => {
      this.coords.wgs84lat = Number.parseFloat(this.inpLat.value)
      this.el.dispatchEvent(new CustomChangeEvent())
    })
    this.inpLon.addEventListener('change', () => {
      this.coords.wgs84lon = Number.parseFloat(this.inpLon.value)
      this.el.dispatchEvent(new CustomChangeEvent())
    })

    /* ***** Clipboard Handler ***** */
    if (!readonly) {
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

    /* ***** "Show on Map" Link (Button) ***** */
    this.mapLink = safeCastElement(HTMLAnchorElement,
      <a class="btn btn-outline-primary" href="#" target="_blank" title={tr('Show on map')}>
        <i class="bi-pin-map"/><span class="visually-hidden"> {tr('Show on map')}</span></a>)
    const preventEventDefault = (event :Event) => event.preventDefault()
    const updateMapLink = () => {
      if (areWgs84CoordsValid(this.coords)) {
        // see also GH issue #37 about opening coords in *any* navigation app on mobile
        //mapLink.href = `https://www.google.com/maps/place/${coord.wgs84lat.toFixed(WGS84_PRECISION)},${coord.wgs84lon.toFixed(WGS84_PRECISION)}`
        // https://developers.google.com/maps/documentation/urls/get-started#search-action
        this.mapLink.href = 'https://www.google.com/maps/search/?api=1&'
          +`query=${this.coords.wgs84lat.toFixed(WGS84_PRECISION)},${this.coords.wgs84lon.toFixed(WGS84_PRECISION)}`
        this.mapLink.removeEventListener('click', preventEventDefault)
      }
      else {  // These are not valid coords, disable the maps link
        this.mapLink.href = '#'
        this.mapLink.addEventListener('click', preventEventDefault)
      }
    }
    this.el.addEventListener(CustomChangeEvent.NAME, updateMapLink)
    updateMapLink()
    this.el.appendChild(this.mapLink)  //TODO: Remove

    /* ***** "Get Coordinates" Dropdown Button ***** */
    const coordIcon = <span><i class="bi-crosshair"/><span class="visually-hidden"> {tr('Coordinates')}</span></span>
    const spinIcon = <div class="spinner-border spinner-border-sm" role="status">
      <span class="visually-hidden">{tr('Please wait')}</span>
    </div>
    const btnCoordsDrop = <button type="button" class="btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"
      disabled={readonly}>{coordIcon}</button>
    btnCoordsDrop.classList.add( readonly ? 'btn-outline-secondary' : 'btn-outline-primary' )
    const btnGetCoords = <button type="button" class="dropdown-item">{tr('Use current location')}</button>
    const dropdownMenu = <ul class="dropdown-menu">{btnGetCoords}</ul>
    this.btnCoords = <>{btnCoordsDrop}{dropdownMenu}</>
    this.el.insertBefore(dropdownMenu, this.el.firstChild); this.el.insertBefore(btnCoordsDrop, dropdownMenu)  //TODO: Remove

    const alertTarget = this.el  //TODO: Not correct, the div.input-group previously had a div parent that was the target
    let curAlert :Alert|null = null
    btnGetCoords.addEventListener('click', () => {
      if (readonly) throw new Error('The control should be readonly, how was the button clicked?')
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
          alertTarget.appendChild(alertDiv)
          const bsAlert = Alert.getOrCreateInstance(alertDiv)
          alertDiv.addEventListener('close.bs.alert', () => { if (curAlert===bsAlert) curAlert=null })
          alertDiv.addEventListener('closed.bs.alert', () => bsAlert.dispose() )
          curAlert = bsAlert
        }, { maximumAge: 1000*30, timeout: 1000*10, enableHighAccuracy: true })
      })
    })

  }

  setCoords(lat :number, lon :number) {
    this.coords.wgs84lat = lat
    this.coords.wgs84lon = lon
    this.inpLat.value = lat.toFixed(WGS84_PRECISION)
    this.inpLon.value = lon.toFixed(WGS84_PRECISION)
    this.el.dispatchEvent(new CustomChangeEvent())
  }

  /** Get a copy of the coordinates being edited by this editor. */
  getCoords() { return this.coords.deepClone() }

  isValid() { return areWgs84CoordsValid(this.coords) }
}
