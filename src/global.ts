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

declare global {
  interface Window {
    Fuchs :FuchsInterface
  }
}

/** A global singleton object that is also made available as `window.Fuchs` so it can be used from the debugging console. */
export class FuchsInterface {

  // singleton
  private constructor() {}
  static readonly instance = new FuchsInterface()
  static { window.Fuchs = FuchsInterface.instance }

  private _fakeSerialRx :null|((v :string)=>void) = null
  /** Is set from inside FUCHS, not to be set by the user */
  set fakeSerialRx(rx :(v :string)=>void) {
    if (this._fakeSerialRx) throw new Error('fakeSerialRx set twice')
    this._fakeSerialRx = rx
  }
  /** For debugging, injects fake data supposedly received via serial port */
  get fakeSerialRx() :(v :string)=>void {
    if (!this._fakeSerialRx) throw new Error('fakeSerialRx wasn\'t set')
    return this._fakeSerialRx
  }

}
