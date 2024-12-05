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
import { SimpleEventHub } from './events'
import { assert } from './utils'

export interface StoreEvent {
  action :'add'|'upd'|'del'|'mod'
  id :string
}

export type HasId = { readonly id :string }
export function hasId(o :unknown) :o is HasId {
  return !!( o && typeof o === 'object' && 'id' in o && typeof o.id === 'string' ) }

export abstract class AbstractStore<T> {
  readonly events :SimpleEventHub<StoreEvent> = new SimpleEventHub()
  //TODO: abstract getAllAsync(except :T|null) :AsyncGenerator<[string, T], void, never>
  /** Return all objects from this store as key/value pairs. */
  abstract getAll(except :T|null) :Promise<[string,T][]>
  /** Get an object, and throw an error if it is not found. */
  abstract get(id :string) :Promise<T>
  /** If this object is added to the store immediately after this call, this call returns the id the object will have. */
  protected abstract _add(obj :T) :Promise<string>
  protected abstract _mod(obj :T) :Promise<string>
  protected abstract _upd(prevObj :T, newObj :T) :Promise<string>
  protected abstract _del(obj :T) :Promise<string>
  /** Add an object, and throw an error if it is already in the store. */
  async add(obj :T) :Promise<string> {
    const id = await this._add(obj)
    this.events.fire({ action: 'add', id: id })
    return id
  }
  /** Replace an object in the store with a new one, throwing an error if the previous object was not in the DB. */
  async upd(prevObj :T, newObj :T) :Promise<string> {
    //TODO: since IDs shouldn't change on update, should we throw an error if they differ?
    const id = await this._upd(prevObj, newObj)
    this.events.fire({ action: 'upd', id: id })
    return id
  }
  /** Delete an object from the store, throwing an error if it is not found. **WARNING:** Deletion will change *other* object's IDs! */
  async del(obj :T) :Promise<string> {
    const id = await this._del(obj)
    this.events.fire({ action: 'del', id: id })
    return id
  }
  /** Report that an item already stored has been modified, for example if a nested object/array has changed.
   *
   * The implementation may need to write the object to storage (or it may have already updated, in which case no store is needed). */
  async mod(obj :T) :Promise<string> {
    const id = await this._mod(obj)
    this.events.fire({ action: 'mod', id: id })
    return id
  }
}

export class ArrayStore<T> extends AbstractStore<T> {
  protected array :T[]
  constructor(array :T[]) { super(); this.array = array }
  protected idx(obj :T) :number {
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
  protected override _add(obj :T) {
    if (this.array.some(o => Object.is(o,obj))) throw new Error('Object already in store')
    return Promise.resolve( (this.array.push(obj)-1).toString() )
  }
  protected override _upd(prevObj :T, newObj :T) {
    const idx = this.idx(prevObj)
    this.array[idx] = newObj
    return Promise.resolve(idx.toString())
  }
  protected override _del(obj :T) {
    const idx = this.idx(obj)
    this.array.splice(idx,1)
    return Promise.resolve(idx.toString())
  }
  protected override _mod(obj :T) {
    return Promise.resolve(this.idx(obj).toString()) }  // nothing else needed here
}
