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

type HasEquals = { equals(other :unknown) :boolean }
function hasEquals(o :unknown) :o is HasEquals {
  return !!( o && typeof o==='object' && 'equals' in o && typeof o.equals==='function' )
}
type HasName = { name :string }
function hasName(o :unknown) :o is HasName {
  return !!( o && typeof o==='object' && 'name' in o && typeof o.name==='string')
}

/** Abstraction for arrays, allowing different backing implementations to be used.
 *
 * All functions accept negative indices.
 */
export abstract class AbstractList<T> {
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

  /** Check whether the value is contained in this list, using one of several criteria:
   * - If the object has an `equals` method, use that.
   * - If the object has a `name` property of type `string`, use that.
   * - Use the `cmp` function to explicitly compare objects.
   *
   * TODO Later: This method is just an idea, I'll have to see which of these variants actually gets used in practice.
   */
  contains(value :T&HasEquals | T&HasName) :boolean
  contains(value :T, cmp :(other:T)=>boolean) :boolean
  contains(value :T, cmp ?:(other:T)=>boolean) :boolean {
    if (hasEquals(value)) {
      for(const v of this) if (value.equals(v)) return true }
    else if (hasName(value)) {
      for(const v of this) if (hasName(v) && value.name===v.name) return true }
    else if (cmp) {
      for(const v of this) if (cmp(v)) return true }
    return false
  }
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
