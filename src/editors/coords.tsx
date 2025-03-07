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
import { areWgs84CoordsValid, RawWgs84Coordinates, WGS84_PRECISION } from '../types/coords'
import { makeValidNumberPat } from '../types/common'
import { jsx, safeCastElement } from '../jsx-dom'
import { numericTextInputStuff } from '../utils'
import { CustomChangeEvent } from '../events'
import { Alert } from 'bootstrap'
import { tr } from '../i18n'

const _pat = makeValidNumberPat()
const VALID_COORD_RE = new RegExp(`^\\s*(${_pat})\\s*,\\s*(${_pat})\\s*$`)

export function makeCoordinateEditor(coord :RawWgs84Coordinates, readonly :boolean) :HTMLDivElement {
  /* TODO: In the field, it is much less common to type coordinates, and the two buttons "set actual coords to current location"
   * and "navigate to nominal coords" are much more important - make the buttons bigger, and hide the rest in a dropdown?
   * ("navigate to" on the left and "set coords" on the right) */

  const coordIcon = <span><i class="bi-crosshair"/><span class="visually-hidden"> {tr('Coordinates')}</span></span>
  const spinIcon = <div class="spinner-border spinner-border-sm" role="status">
    <span class="visually-hidden">{tr('Please wait')}</span>
  </div>
  const btnCoords = <button type="button" class="btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"
    disabled={readonly}>{coordIcon}</button>
  btnCoords.classList.add( readonly ? 'btn-outline-secondary' : 'btn-outline-primary' )
  const btnGetCoords = <button type="button" class="dropdown-item">{tr('Use current location')}</button>
  const inpLat = safeCastElement(HTMLInputElement,
    <input type="text" inputmode="decimal" pattern={makeValidNumberPat(WGS84_PRECISION)}
      value={coord.wgs84lat!==null && Number.isFinite(coord.wgs84lat)?coord.wgs84lat.toFixed(WGS84_PRECISION):''}
      required={!readonly} readonly={readonly}
      class="form-control" placeholder={tr('Latitude')} aria-label={tr('Latitude')} title={tr('Latitude')} />)
  numericTextInputStuff(inpLat)
  const inpLon = safeCastElement(HTMLInputElement,
    <input type="text" inputmode="decimal" pattern={makeValidNumberPat(WGS84_PRECISION)}
      value={coord.wgs84lon!==null && Number.isFinite(coord.wgs84lon)?coord.wgs84lon.toFixed(WGS84_PRECISION):''}
      required={!readonly} readonly={readonly}
      class="form-control" placeholder={tr('Longitude')} aria-label={tr('Longitude')} title={tr('Longitude')} />)
  numericTextInputStuff(inpLon)
  const mapLink = safeCastElement(HTMLAnchorElement,
    <a class="btn btn-outline-primary" href="#" target="_blank" title={tr('Show on map')}>
      <i class="bi-pin-map"/><span class="visually-hidden"> {tr('Show on map')}</span></a>)
  const grp = <div class="input-group">
    {btnCoords}<ul class="dropdown-menu">{btnGetCoords}</ul>
    <span class="input-group-text d-none d-sm-flex" title={tr('Latitude')}>{tr('Lat')}</span> {inpLat}
    <span class="input-group-text d-none d-sm-flex" title={tr('Longitude')}>{tr('Lon')}</span> {inpLon}
    {mapLink}
  </div>
  const el = safeCastElement(HTMLDivElement, <div>{grp}</div>)

  const preventClick = (event :Event) => event.preventDefault()
  const coordsUpdated = (fire :boolean = false) => {
    if (areWgs84CoordsValid(coord)) {
      //TODO Later: On mobile, how to open location in *any* navigation app?
      //mapLink.href = `https://www.google.com/maps/place/${coord.wgs84lat.toFixed(WGS84_PRECISION)},${coord.wgs84lon.toFixed(WGS84_PRECISION)}`
      // https://developers.google.com/maps/documentation/urls/get-started#search-action
      mapLink.href = `https://www.google.com/maps/search/?api=1&query=${coord.wgs84lat.toFixed(WGS84_PRECISION)},${coord.wgs84lon.toFixed(WGS84_PRECISION)}`
      mapLink.removeEventListener('click', preventClick)
    }
    else {  // These are not valid coords, disable the maps link
      mapLink.href = '#'
      mapLink.addEventListener('click', preventClick)
    }
    if (fire) el.dispatchEvent(new CustomChangeEvent())
  }
  coordsUpdated()
  inpLat.addEventListener('change', () => {
    coord.wgs84lat = Number.parseFloat(inpLat.value)
    coordsUpdated(true)
  })
  inpLon.addEventListener('change', () => {
    coord.wgs84lon = Number.parseFloat(inpLon.value)
    coordsUpdated(true)
  })
  const setCoords = (lat :number, lon :number) => {
    coord.wgs84lat = lat
    coord.wgs84lon = lon
    inpLat.value = lat.toFixed(WGS84_PRECISION)
    inpLon.value = lon.toFixed(WGS84_PRECISION)
    coordsUpdated(true)
  }

  let curAlert :Alert|null = null
  btnGetCoords.addEventListener('click', () => {
    if (readonly) throw new Error('The control should be readonly, how was the button clicked?')
    setTimeout(()=>{  // if we were to immediately disable the button, the dropdown wouldn't auto-hide
      btnCoords.setAttribute('disabled', 'disabled')
      btnCoords.replaceChildren(spinIcon)
      const reenable = () => {
        btnCoords.removeAttribute('disabled')
        btnCoords.replaceChildren(coordIcon)
      }
      navigator.geolocation.getCurrentPosition(pos => {
        reenable()
        setCoords(pos.coords.latitude, pos.coords.longitude)
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
        el.appendChild(alertDiv)
        const bsAlert = Alert.getOrCreateInstance(alertDiv)
        alertDiv.addEventListener('close.bs.alert', () => { if (curAlert===bsAlert) curAlert=null })
        alertDiv.addEventListener('closed.bs.alert', () => bsAlert.dispose() )
        curAlert = bsAlert
      }, { maximumAge: 1000*30, timeout: 1000*10, enableHighAccuracy: true })
    })
  })

  const pasteHandler = (event :ClipboardEvent) => {
    const txt = event.clipboardData?.getData('text/plain')
    if (txt) {
      const m = txt.match(VALID_COORD_RE)
      if (m) {
        const lat = Number.parseFloat(m[1] ?? '')
        const lon = Number.parseFloat(m[2] ?? '')
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          console.debug('Parsed clipboard', txt, 'to', lat, lon)
          setCoords(lat, lon)
          event.preventDefault()
          event.stopPropagation()
        }
      }
    }
  }
  if (!readonly) {
    inpLat.addEventListener('paste', pasteHandler)
    inpLon.addEventListener('paste', pasteHandler)
  }

  return el
}
