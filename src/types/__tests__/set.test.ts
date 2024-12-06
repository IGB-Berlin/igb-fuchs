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
import { dataSetsEqual } from '../set'

test('dataSetsEqual', () => {
  class X {
    readonly x :string
    constructor(x :string) { this.x = x }
    equals(o: unknown) { return !!( o && typeof o==='object' && Object.keys(o).length===1 && 'x' in o && this.x===o.x ) }
  }
  expect( dataSetsEqual([],[]) ).toStrictEqual( true )
  expect( dataSetsEqual([new X('x')],[]) ).toStrictEqual( false )
  expect( dataSetsEqual([new X('x')],[new X('y')]) ).toStrictEqual( false )
  expect( dataSetsEqual([new X('x')],[new X('x')]) ).toStrictEqual( true )
  expect( dataSetsEqual([new X('x'), new X('y')],[new X('x'), new X('y')]) ).toStrictEqual( true )
  expect( dataSetsEqual([new X('x'), new X('y')],[new X('y'), new X('x')]) ).toStrictEqual( true )
  expect( dataSetsEqual([new X('x'), new X('y')],[new X('z'), new X('y')]) ).toStrictEqual( false )
  expect( dataSetsEqual([new X('x'), new X('x'), new X('x')],[new X('x'), new X('x'), new X('x')]) ).toStrictEqual( true )
  expect( dataSetsEqual([new X('x'), new X('x'), new X('y')],[new X('y'), new X('y'), new X('x')]) ).toStrictEqual( false )
  expect( dataSetsEqual([new X('y'), new X('x'), new X('y')],[new X('x'), new X('y'), new X('y')]) ).toStrictEqual( true )
  expect( dataSetsEqual([new X('x'), new X('y'), new X('z')],[new X('z'), new X('x'), new X('y')]) ).toStrictEqual( true )
})
