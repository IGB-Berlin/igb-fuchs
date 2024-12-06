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
import { expect, test } from '@jest/globals'
import { distanceBearing } from '../geo-func'

test('haversineKm', () => {
  const x = distanceBearing(
    { wgs84lat: 52.516312, wgs84lon: 13.377657 },
    { wgs84lat: 52.514556, wgs84lon: 13.350120 } )
  expect( x.distKm ).toBeCloseTo( 1.874, 2 )
  expect( x.bearingDeg ).toBeCloseTo( 264, 1 )
})
