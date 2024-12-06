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
import { IWgs84Coordinates, WGS84_PRC_STEP, WGS84_PRECISION, Wgs84Coordinates } from '../types/coords'
import { jsx, safeCastElement } from '../jsx-dom'
import { CustomChangeEvent } from '../events'
import { Alert } from 'bootstrap'
import { tr } from '../i18n'

export function makeCoordinateEditor(coord :IWgs84Coordinates) :HTMLDivElement {

  const btnGetCoords = <button class="btn btn-outline-primary" type="button" title={tr('Use current location')}>
    <i class="bi-crosshair"/><span class="visually-hidden">{tr('Use current location')}</span></button>
  const inpLat = safeCastElement(HTMLInputElement,
    <input type="number" min="-90" max="90" step={WGS84_PRC_STEP} value={coord.wgs84lat.toFixed(WGS84_PRECISION)} required
      class="form-control" placeholder={tr('Latitude')} aria-label={tr('Latitude')} title={tr('Latitude')} />)
  const inpLon = safeCastElement(HTMLInputElement,
    <input type="number" min="-180" max="180" step={WGS84_PRC_STEP} value={coord.wgs84lon.toFixed(WGS84_PRECISION)} required
      class="form-control" placeholder={tr('Longitude')} aria-label={tr('Longitude')} title={tr('Longitude')} />)
  const mapLink = safeCastElement(HTMLAnchorElement,
    <a class="btn btn-outline-primary" href="#" target="_blank" title={tr('Show on map')}>
      <i class="bi-pin-map"/><span class="visually-hidden">{tr('Show on map')}</span></a>)
  const grp = <div class="input-group">
    {btnGetCoords}
    <span class="input-group-text" title={tr('Latitude')}>{tr('Lat')}</span> {inpLat}
    <span class="input-group-text" title={tr('Longitude')}>{tr('Lon')}</span> {inpLon}
    {mapLink}
  </div>
  const el = safeCastElement(HTMLDivElement, <div>{grp}</div>)

  const preventClick = (event :Event) => event.preventDefault()
  const coordsUpdated = (fire :boolean = false) => {
    const c = new Wgs84Coordinates(coord)
    try {
      c.validate([])
      // No error thrown: These are valid coords, so enable the maps link:
      //mapLink.href = `https://www.google.com/maps/place/${coord.wgs84lat.toFixed(WGS84_PRECISION)},${coord.wgs84lon.toFixed(WGS84_PRECISION)}`
      // https://developers.google.com/maps/documentation/urls/get-started#search-action
      mapLink.href = `https://www.google.com/maps/search/?api=1&query=${coord.wgs84lat.toFixed(WGS84_PRECISION)},${coord.wgs84lon.toFixed(WGS84_PRECISION)}`
      mapLink.removeEventListener('click', preventClick)
    }
    catch (_) {  // These are not valid coords, disable the maps link
      mapLink.href = '#'
      mapLink.addEventListener('click', preventClick)
      return
    }
    if (fire) el.dispatchEvent(new CustomChangeEvent())
  }
  coordsUpdated()
  inpLat.addEventListener('change', () => {
    coord.wgs84lat = inpLat.valueAsNumber
    coordsUpdated(true)
  })
  inpLon.addEventListener('change', () => {
    coord.wgs84lon = inpLon.valueAsNumber
    coordsUpdated(true)
  })
  const setCoords = (lat :number, lon :number) => {
    coord.wgs84lat = lat
    coord.wgs84lon = lon
    inpLat.value = lat.toFixed(WGS84_PRECISION)
    inpLon.value = lon.toFixed(WGS84_PRECISION)
    coordsUpdated(true)
  }

  const getCoordsSpin = <div class="input-group-text">
    <div class="spinner-border spinner-border-sm" role="status">
      <span class="visually-hidden">{tr('Please wait')}</span>
    </div>
  </div>
  let curAlert :Alert|null = null
  btnGetCoords.addEventListener('click', () => {
    grp.replaceChild(getCoordsSpin, btnGetCoords)
    navigator.geolocation.getCurrentPosition(pos => {
      grp.replaceChild(btnGetCoords, getCoordsSpin)
      setCoords(pos.coords.latitude, pos.coords.longitude)
    }, err => {
      grp.replaceChild(btnGetCoords, getCoordsSpin)
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

  const pasteHandler = (event :ClipboardEvent) => {
    const txt = event.clipboardData?.getData('text/plain')
    if (txt) {
      const m = txt.match(/^\s*([-+]?[0-9]+(?:\.[0-9]+)?)\s*,\s*([-+]?[0-9]+(?:\.[0-9]+))?\s*$/)
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
  inpLat.addEventListener('paste', pasteHandler)
  inpLon.addEventListener('paste', pasteHandler)

  return el
}
