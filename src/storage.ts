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
import { assert } from './utils'

export abstract class AbstractStore<T> {
  /** Return all objects from this store as key/value pairs. */
  abstract getAll(except :T|null) :Promise<[string,T][]>
  /** Get an object, and throw an error if it is not found. */
  abstract get(id :string) :Promise<T>
  /** Add an object, and throw an error if it is already in the store. */
  abstract add(obj :T) :Promise<string>
  /** Replace an object in the store with a new one, throwing an error if the previous object was not in the DB. */
  abstract upd(prevObj :T, newObj :T) :Promise<string>
  /** Delete an object from the store, throwing an error if it is not found. **WARNING:** Deletion will change *other* object's IDs! */
  abstract del(obj :T) :Promise<string>
}

export class ArrayStore<T> extends AbstractStore<T> {
  /* TODO Later: ArrayStore is a bit inefficient, can it be removed so we can allow ListEditors to edit arrays directly? (maybe two ListEditor subclasses?)
   * Similarly, Editor just does two operations on targetStore (add/upd/mod), perhaps it can get an abstraction object?
   * For that abstraction, do *all* objects need an id/idx ? If not, can probably remove the .id and just use keys? */
  private readonly array
  constructor(array :T[]) { super(); this.array = array }
  private idx(obj :T) :number {
    const idx = this.array.findIndex(o => Object.is(o,obj))
    if (idx<0) throw new Error('Object not found in store')
    assert(idx<this.array.length)
    return idx
  }
  override getAll(except :T|null) {
    return Promise.resolve(this.array.filter(o => except===null || !Object.is(o,except)).map((o,i) => {
      const rv :[string,T] = [i.toString(),o]
      return rv
    }))
  }
  override get(id :string) {
    const idx = Number.parseInt(id,10)
    if (!Number.isFinite(idx) || idx<0 || idx>=this.array.length) throw new Error(`Id "${id}" not found`)
    const rv = this.array[idx]
    assert(rv)
    return Promise.resolve(rv)
  }
  override add(obj :T) {
    if (this.array.some(o => Object.is(o,obj))) throw new Error('Object already in store')
    return Promise.resolve( (this.array.push(obj)-1).toString() )
  }
  override upd(prevObj :T, newObj :T) {
    const idx = this.idx(prevObj)
    this.array[idx] = newObj
    return Promise.resolve(idx.toString())
  }
  override del(obj :T) {
    const idx = this.idx(obj)
    this.array.splice(idx,1)
    return Promise.resolve(idx.toString())
  }
}
