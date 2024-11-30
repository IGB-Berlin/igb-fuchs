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
import { SimpleEventHub } from '../events'
import { assert } from '../utils'

interface StoreEvent {
  action :'add'|'set'|'del'|'mod'
  id :string
}

export type HasId = { readonly id :string }

export abstract class AbstractStore<T extends HasId> {
  readonly events :SimpleEventHub<StoreEvent> = new SimpleEventHub()
  abstract getAll() :Promise<T[]>
  abstract get(id :string) :Promise<T>
  protected abstract _add(obj :T) :Promise<void>
  protected abstract _set(obj :T) :Promise<void>
  protected abstract _del(obj :T) :Promise<void>
  async add(obj :T) :Promise<void> {
    await this._add(obj)
    this.events.fire({ action: 'add', id: obj.id })
  }
  async set(obj :T) :Promise<void> {
    await this._set(obj)
    this.events.fire({ action: 'set', id: obj.id })
  }
  async del(obj :T) :Promise<void> {
    await this._del(obj)
    this.events.fire({ action: 'del', id: obj.id })
  }
  /** Fire an event reporting that an item already stored has been modified. */
  reportChange(id :string) { this.events.fire({ action: 'mod', id: id }) }
}

export class MapStore<T extends HasId> extends AbstractStore<T> {  //TODO: test and use this
  protected map :Map<string, T> = new Map()
  override getAll() { return Promise.resolve(Array.from(this.map.values())) }
  override get(id :string) {
    const rv = this.map.get(id)
    if (!rv) return Promise.reject(new Error(`Id "${id}" not found`))
    return Promise.resolve(rv)
  }
  protected override _add(obj :T) {
    if (this.map.has(obj.id)) return Promise.reject(new Error(`Id "${obj.id}" already in store`))
    this.map.set(obj.id, obj)
    return Promise.resolve()
  }
  protected override _set(obj :T) {
    if (!this.map.has(obj.id)) return Promise.reject(new Error(`Id "${obj.id}" not found`))
    this.map.set(obj.id, obj)
    return Promise.resolve()
  }
  protected override _del(obj :T) {
    const rv = this.map.delete(obj.id)
    assert(rv, `Id "${obj.id}" not found`)
    return Promise.resolve()
  }
}

/** Abstraction for arrays, allowing different backing implementations to be used.
 *
 * All functions accept negative indices.
 */
abstract class AbstractList<T> {
  /** This list's length. */
  abstract get length() :number
  /** Get an item. */
  abstract get(index :number) :T
  /** Set an item. */
  abstract set(index :number, value :T) :void
  /** Append an item to the end of the list; returns the new item's index.
   *
   * Note this is *unlike* JavaScript's `Array.push()`, which returns the new length instead. */
  abstract add(value :T) :number
  /** Delete an item from the list, shifting remaining items down. */
  abstract del(index :number) :T
  abstract [Symbol.iterator]() :Iterator<Readonly<T>>
}

interface ListEvent {
  action :'set'|'add'|'del'|'mod'
  index :number
}

/** An abstract class that provides a `SimpleEventHub` for changes made to the list.
 *
 * Implementations should *not* override `set`, `add`, and `del`. */
export abstract class EventList<T> extends AbstractList<T> {
  readonly events :SimpleEventHub<ListEvent> = new SimpleEventHub()
  protected abstract _set(index :number, value :T) :void
  protected abstract _add(value :T) :number
  protected abstract _del(index :number) :T
  set(index :number, value :T) :void {
    this._set(index, value)
    this.events.fire({ action: 'set', index: index })
  }
  add(value :T) :number {
    const index = this._add(value)
    this.events.fire({ action: 'add', index: index })
    return index
  }
  del(index :number) :T {
    const value = this._del(index)
    this.events.fire({ action: 'del', index: index })
    return value
  }
  /** Fire an event reporting that an item already stored in this list has been modified. */
  reportChange(index :number) :void {
    this.events.fire({ action: 'mod', index: index })
  }
}

/** A list backed by an array, with events. */
export class ArrayEventList<T> extends EventList<T> {
  protected readonly array :T[]
  constructor(array ?:T[]) {
    super()
    this.array = array ?? []
  }
  override get length() { return this.array.length }
  override get(index :number) {
    assert(index>=-this.array.length && index<this.array.length)
    const item = this.array.at(index)
    assert(item)
    return item
  }
  protected override _set(index :number, value :T) {
    assert(index>=-this.array.length && index<this.array.length)
    this.array[index<0 ? index + this.array.length : index] = value
  }
  protected override _add(value :T) :number { return this.array.push(value) - 1 }
  protected override _del(index :number) :T {
    const item = this.get(index)  // also checks index
    this.array.splice(index, 1)  // supports negative indices
    return item
  }
  [Symbol.iterator]() { return this.array.values() }
}

type HasEquals = { equals(other :unknown) :boolean }

/** Compares two arrays of objects as sets (i.e. order doesn't matter!), returning `true` if they are the same;
 * the objects must provide an `equals` method. */
export function dataSetsEqual<T extends HasEquals>(a :T[]|AbstractList<T>, b :T[]|AbstractList<T>) :boolean {
  const x :T[] = Array.from(a)
  const y :T[] = Array.from(b)
  if (x.length!==y.length) return false
  for (let i = x.length-1; i>=0; i--) {
    if (!y.length) return false
    for (let j = y.length-1; j>=0; j--) {
      if (x[i]?.equals(y[j])) {
        x.splice(i,1)
        y.splice(j,1)
        break
      }
    }
  }
  return x.length===0 && y.length===0
}
