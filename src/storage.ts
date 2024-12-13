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
import { assert, paranoia } from './utils'

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

export abstract class OrderedStore<T> extends AbstractStore<T> {
  /** Move an object up or down in the ordered store. **WARNING:** This will change objects' IDs! */
  abstract move(id :string, dir :'up'|'down') :string
}

/** An `AbstractStore` backed by an array.
 *
 * This class's implementation is a little inefficient, but considering that the arrays we expect
 * to be editing in this application shouldn't get *that* big, that's probably not a problem.
 */
export class ArrayStore<T> extends OrderedStore<T> {
  private readonly array
  constructor(array :T[]) { super(); this.array = array }
  private idx(obj :T) :number {
    const idx = this.array.findIndex(o => Object.is(obj,o))
    if (idx<0) throw new Error('Object not found in store')
    assert(idx<this.array.length)
    return idx
  }
  private id2idx(id :string) :number {
    const idx = Number.parseInt(id,10)
    if (!Number.isFinite(idx) || idx<0 || idx>=this.array.length) throw new Error(`Invalid id "${id}"`)
    return idx
  }
  override getAll(except :T|null) {
    return Promise.resolve(this.array.filter(o => except===null || !Object.is(except,o)).map((o,i) => {
      const rv :[string,T] = [i.toString(),o]
      return rv
    }))
  }
  override get(id :string) {
    const rv = this.array[this.id2idx(id)]
    assert(rv)
    return Promise.resolve(rv)
  }
  override add(obj :T) {
    if (this.array.some(o => Object.is(obj,o))) throw new Error('Object already in store')
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
  override move(id :string, dir :'up'|'down') :string {
    const idx = this.id2idx(id)
    if (idx===0 && dir==='up' || idx===this.array.length-1 && dir==='down')
      return idx.toString()
    const oi = dir==='up' ? idx-1 : idx+1
    paranoia(oi>=0 && oi<this.array.length)
    const item = this.array[idx]
    assert(item)
    const other = this.array[oi]
    assert(other)
    this.array[oi] = item
    this.array[idx] = other
    return oi.toString()
  }
}
