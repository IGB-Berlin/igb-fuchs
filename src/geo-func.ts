/** Based on: https://www.movable-type.co.uk/scripts/latlong.html
 * © 2002-2022 Chris Veness
 * MIT Licence
 */
import { IWgs84Coordinates } from './types/coords'

export function distanceBearing(one :IWgs84Coordinates, two :IWgs84Coordinates) {
  // Haversine formula
  const R = 6371.0 // km
  const φ1 = one.wgs84lat * Math.PI/180 // φ, λ in radians
  const φ2 = two.wgs84lat * Math.PI/180
  const λ1 = one.wgs84lon * Math.PI/180
  const λ2 = two.wgs84lon * Math.PI/180
  const Δφ = (two.wgs84lat - one.wgs84lat) * Math.PI/180
  const Δλ = (two.wgs84lon - one.wgs84lon) * Math.PI/180
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const d = R * c  // result in same units as R
  // Initial bearing (from one to two)
  const y = Math.sin(λ2-λ1) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2-λ1)
  const θ = Math.atan2(y, x)
  const b = (θ*180/Math.PI + 360) % 360  // in degrees, compass heading
  return { distKm: d, bearingDeg: b }
}
