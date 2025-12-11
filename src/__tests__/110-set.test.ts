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
import { test, expect } from 'playwright-test-coverage'

test('dataSetsEqual', async ({ page }) => {
  await page.goto('/')
  expect( await page.evaluate(() => {
    class X {
      readonly x :string
      constructor(x :string) { this.x = x }
      equals(o: unknown) { return !!( o && typeof o==='object' && Object.keys(o).length===1 && 'x' in o && this.x===o.x ) }
    }
    const dataSetsEqual = window.FuchsTest.dataSetsEqual
    return dataSetsEqual([],[])
      && !dataSetsEqual([new X('x')],[])
      && !dataSetsEqual([new X('x')],[new X('y')])
      &&  dataSetsEqual([new X('x')],[new X('x')])
      &&  dataSetsEqual([new X('x'), new X('y')],[new X('x'), new X('y')])
      &&  dataSetsEqual([new X('x'), new X('y')],[new X('y'), new X('x')])
      && !dataSetsEqual([new X('x'), new X('y')],[new X('z'), new X('y')])
      &&  dataSetsEqual([new X('x'), new X('x'), new X('x')],[new X('x'), new X('x'), new X('x')])
      && !dataSetsEqual([new X('x'), new X('x'), new X('y')],[new X('y'), new X('y'), new X('x')])
      &&  dataSetsEqual([new X('y'), new X('x'), new X('y')],[new X('x'), new X('y'), new X('y')])
      &&  dataSetsEqual([new X('x'), new X('y'), new X('z')],[new X('z'), new X('x'), new X('y')])
  })).toStrictEqual( true )
})
