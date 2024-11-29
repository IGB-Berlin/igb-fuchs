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
import { expect, test } from '@jest/globals'
import * as storage from '../storage'

test('storage', () => {
  expect( storage.get('test') ).toBeNull()
  storage.set('test','x')
  expect( storage.get('test') ).toStrictEqual('x')

  expect( storage.get(['test','foo']) ).toBeNull()
  storage.set(['test','foo'], 'y')
  expect( storage.get(['test','foo']) ).toStrictEqual('y')

  storage.set(['test','bar'], 'z')
  storage.set(['test','foo','quz'], 'a')
  expect( storage.list(['test']) ).toStrictEqual( [['test','foo'], ['test','bar']] )

  expect( () => storage.get('x/y') ).toThrowError()
  expect( () => storage.get(['abc','x/y']) ).toThrowError()
})
