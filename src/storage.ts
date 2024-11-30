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
import { isISamplingTrip, isISamplingTripTemplate, SamplingTrip, SamplingTripTemplate } from './types/trip'
import { SimpleEventHub } from './events'
import { assert } from './utils'

interface StoreEvent {
  action :'add'|'upd'|'del'|'mod'
  id :string
}

export type HasId = { readonly id :string }
export function hasId(o :unknown) :o is HasId {
  return !!( o && typeof o === 'object' && 'id' in o && typeof o.id === 'string' ) }

export abstract class AbstractStore<T> {
  readonly events :SimpleEventHub<StoreEvent> = new SimpleEventHub()
  abstract id(obj :T) :string
  abstract getAll(except :T|null) :Promise<[string,T][]>
  abstract get(id :string) :Promise<T>
  /** If this object is added to the store immediately after this call, this call returns the id the object will have. */
  abstract addId(obj :T) :string
  protected abstract _add(obj :T) :Promise<string>
  protected abstract _mod(obj :T) :Promise<string>
  protected abstract _upd(prevObj :T, newObj :T) :Promise<string>
  protected abstract _del(obj :T) :Promise<string>
  async add(obj :T) :Promise<string> {
    const id = await this._add(obj)
    this.events.fire({ action: 'add', id: id })
    return id
  }
  async upd(prevObj :T, newObj :T) :Promise<string> {
    const id = await this._upd(prevObj, newObj)
    this.events.fire({ action: 'upd', id: id })
    return id
  }
  /** **WARNING:** Deletion will change *other* object's IDs! */
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
  override id(obj :T) { return this.idx(obj).toString() }
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
  override addId(_obj :T) { return this.array.length.toString() }
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

const IDB_NAME = 'IGB-Field'
const SAMP_TRIPS = 'sampling-trips'
const TRIP_TEMPLATES = 'trip-templates'

export const CAN_STORAGE :boolean = (() => {
  //TODO: rewrite this
  let storage :Storage|undefined
  try {
    storage = window['localStorage']
    const x = '__storage_test__'
    storage.setItem(x, x)
    storage.removeItem(x)
    return true
  } catch (e) {
    return !!( e instanceof DOMException && e.name === 'QuotaExceededError' && storage && storage.length>0 )
  }
})()

export class IndexedStorage {  //TODO: test and use this
  static open() {
    return new Promise<IndexedStorage>((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(new IndexedStorage(req.result))
      req.onupgradeneeded = () => {
        req.result.createObjectStore(TRIP_TEMPLATES, { keyPath: 'id' })
        req.result.createObjectStore(SAMP_TRIPS, { keyPath: 'id' })
      }
    })
  }
  protected readonly db :IDBDatabase
  protected constructor(db :IDBDatabase) {
    this.db = db
  }
  protected getAll<T extends HasId>(storeName :string, typeChecker :(o :HasId)=>o is T, except :T|null) {
    return new Promise<T[]>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readonly')
      trans.onerror = () => reject(trans.error)
      const req = trans.objectStore(storeName).getAll()
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        const rv :T[] = []
        const del :HasId[] = []
        for(const o of req.result) {
          if (hasId(o) && typeChecker(o)) {
            if (!except || except.id!==o.id) rv.push(o) }
          else if (hasId(o)) del.push(o)
          else console.error('Didn\'t have id?',o)
        }
        console.debug('IDB getAll', storeName, 'got',rv.length,'bad',del.length)
        resolve(rv)
        if (del.length)
          setTimeout(async () => {
            console.error('These objects didn\'t pass the type checker, deleting', del)
            for(const o of del) await this.del(storeName, o)
          })
      }
    })
  }
  protected get<T extends HasId>(storeName :string, key :string, typeChecker :(o :HasId)=>o is T) {
    return new Promise<T>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readonly')
      trans.onerror = () => reject(trans.error)
      // Prefer .openCursor() over .get() b/c the former tells us when there was no such key
      const req = trans.objectStore(storeName).openCursor(key)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        if (req.result) {
          const obj :unknown = req.result.value
          if (hasId(obj) && typeChecker(obj)) {
            console.debug('IDB get', storeName, obj.id)
            resolve(obj)
          }
          else {
            reject(new Error(`Result didn't pass type check (${JSON.stringify(obj)})`))
            if (hasId(obj)) {
              setTimeout(async () => {
                console.error('This object didn\'t pass the checker, deleting', obj)
                await this.del(storeName, obj)
              })
            } else console.error('Didn\'t have id?', obj)
          }
        } else reject(new Error(`Key ${key} not found`))
      }
    })
  }
  protected add(storeName :string, data :HasId) {
    return new Promise<string>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readwrite')
      trans.onerror = () => reject(trans.error)
      trans.oncomplete = () => {
        console.debug('IDB add', storeName, data.id)
        resolve(data.id)
      }
      // .add() already throws an error if the Id already exists
      const req = trans.objectStore(storeName).add(data)
      req.onerror = () => reject(req.error)
    })
  }
  protected upd(storeName :string, prevObj :HasId, newObj :HasId) {
    return new Promise<string>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readwrite')
      trans.onerror = () => reject(trans.error)
      trans.oncomplete = () => {
        console.debug('IDB upd', storeName, prevObj.id, newObj.id)
        resolve(newObj.id)
      }
      const store = trans.objectStore(storeName)
      const req1 = store.openCursor(prevObj.id)
      req1.onerror = () => reject(req1.error)
      req1.onsuccess = () => {
        if (req1.result) {  // was found
          const req2 = req1.result.update(newObj)
          req2.onerror = () => reject(req2.error)
        }
        else reject(new Error(`Key ${prevObj.id} not found`))
      }
    })
  }
  protected del(storeName :string, data :HasId) {
    return new Promise<string>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readwrite')
      trans.onerror = () => reject(trans.error)
      trans.oncomplete = () => {
        console.debug('IDB del', storeName, data.id)
        resolve(data.id)
      }
      const store = trans.objectStore(storeName)
      const req1 = store.openCursor(data.id)
      req1.onerror = () => reject(req1.error)
      req1.onsuccess = () => {
        if (req1.result) {  // was found
          const req2 = req1.result.delete()
          req2.onerror = () => reject(req2.error)
        }
        else reject(new Error(`Key ${data.id} not found`))
      }
    })
  }
  tripTemplates() :AbstractStore<SamplingTripTemplate> {
    class TripTempStore extends AbstractStore<SamplingTripTemplate> {
      protected readonly store :IndexedStorage
      constructor(store :IndexedStorage) { super(); this.store = store }
      override id(obj :SamplingTripTemplate) { return obj.id }
      override async getAll(except :SamplingTripTemplate|null) :Promise<[string,SamplingTripTemplate][]> {
        return (await this.store.getAll(TRIP_TEMPLATES, isISamplingTripTemplate, except)).map(o => [o.id, new SamplingTripTemplate(o)]) }
      override async get(id :string) :Promise<SamplingTripTemplate> {
        return new SamplingTripTemplate(await this.store.get(TRIP_TEMPLATES, id, isISamplingTripTemplate)) }
      override addId(obj :SamplingTripTemplate) { return obj.id }
      protected override _add(obj :SamplingTripTemplate) { return this.store.add(TRIP_TEMPLATES, obj) }
      protected override _upd(prevObj :SamplingTripTemplate, newObj :SamplingTripTemplate) {
        return this.store.upd(TRIP_TEMPLATES, prevObj, newObj) }
      protected override _mod(obj :SamplingTripTemplate) { return this.store.upd(TRIP_TEMPLATES, obj, obj) }
      protected override _del(obj :SamplingTripTemplate) { return this.store.del(TRIP_TEMPLATES, obj) }
    }
    return new TripTempStore(this)
  }
  samplingTrips() :AbstractStore<SamplingTrip> {
    class SampTripStore extends AbstractStore<SamplingTrip> {
      protected readonly store :IndexedStorage
      constructor(store :IndexedStorage) { super(); this.store = store }
      override id(obj :SamplingTrip) { return obj.id }
      override async getAll(except :SamplingTrip|null) :Promise<[string,SamplingTrip][]> {
        return (await this.store.getAll(SAMP_TRIPS, isISamplingTrip, except)).map(o => [o.id, new SamplingTrip(o, null) ]) }
      override async get(id :string) :Promise<SamplingTrip> {
        return new SamplingTrip(await this.store.get(SAMP_TRIPS, id, isISamplingTrip), null) }
      override addId(obj :SamplingTrip) { return obj.id }
      protected override _add(obj :SamplingTrip) { return this.store.add(SAMP_TRIPS, obj) }
      protected override _upd(prevObj :SamplingTrip, newObj :SamplingTrip) {
        return this.store.upd(SAMP_TRIPS, prevObj, newObj) }
      protected override _mod(obj :SamplingTrip) { return this.store.upd(SAMP_TRIPS, obj, obj) }
      protected override _del(obj :SamplingTrip) { return this.store.del(SAMP_TRIPS, obj) }
    }
    return new SampTripStore(this)
  }
}
