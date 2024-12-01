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
import { SamplingLocationTemplate } from './types/location'
import { AbstractStore, HasId, hasId } from './storage'
import { MeasurementType } from './types/meas-type'
import { SampleTemplate } from './types/sample'
import { deduplicatedSet } from './types/set'

const IDB_NAME = 'IGB-Field'
const SELF_TEST_STORE = '_self_test'
const SAMP_TRIPS = 'sampling-trips'
const TRIP_TEMPLATES = 'trip-templates'

export class IndexedStorage {

  static open() {
    return new Promise<IndexedStorage>((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(new IndexedStorage(req.result))
      req.onupgradeneeded = () => {
        req.result.createObjectStore(SELF_TEST_STORE, { keyPath: 'id' })
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
      trans.oncomplete = async () => {
        console.debug('IDB add', storeName, data.id)
        resolve(data.id)
        await this.updateTemplates()
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
      trans.oncomplete = async () => {
        console.debug('IDB upd', storeName, prevObj.id, newObj.id)
        resolve(newObj.id)
        await this.updateTemplates()
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
      trans.oncomplete = async () => {
        console.debug('IDB del', storeName, data.id)
        resolve(data.id)
        await this.updateTemplates()
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
      override async getAll(except :SamplingTripTemplate|null) :Promise<[string,SamplingTripTemplate][]> {
        return (await this.store.getAll(TRIP_TEMPLATES, isISamplingTripTemplate, except)).map(o => [o.id, new SamplingTripTemplate(o)]) }
      override async get(id :string) :Promise<SamplingTripTemplate> {
        return new SamplingTripTemplate(await this.store.get(TRIP_TEMPLATES, id, isISamplingTripTemplate)) }
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
      override async getAll(except :SamplingTrip|null) :Promise<[string,SamplingTrip][]> {
        return (await this.store.getAll(SAMP_TRIPS, isISamplingTrip, except)).map(o => [o.id, new SamplingTrip(o, null) ]) }
      override async get(id :string) :Promise<SamplingTrip> {
        return new SamplingTrip(await this.store.get(SAMP_TRIPS, id, isISamplingTrip), null) }
      protected override _add(obj :SamplingTrip) { return this.store.add(SAMP_TRIPS, obj) }
      protected override _upd(prevObj :SamplingTrip, newObj :SamplingTrip) {
        return this.store.upd(SAMP_TRIPS, prevObj, newObj) }
      protected override _mod(obj :SamplingTrip) { return this.store.upd(SAMP_TRIPS, obj, obj) }
      protected override _del(obj :SamplingTrip) { return this.store.del(SAMP_TRIPS, obj) }
    }
    return new SampTripStore(this)
  }

  async selfTest() :Promise<boolean> {
    class DummyObj implements HasId {
      readonly id :string
      readonly foo :string
      constructor(id :string, foo :string) { this.id = id; this.foo = foo }
    }
    function isDummyObj(o :unknown) :o is DummyObj {
      return !!( hasId(o) && 'foo' in o && typeof o.foo === 'string' ) }
    try {
      if ( (await this.getAll(SELF_TEST_STORE, isDummyObj, null)).length !== 0 ) return false
      const d1 = new DummyObj('one', 'bar')
      try { await this.upd(SELF_TEST_STORE, d1, d1); return false } catch (_) { /*expected*/ }
      if ( await this.add(SELF_TEST_STORE, d1) !== 'one' ) return false
      try { await this.add(SELF_TEST_STORE, d1); return false } catch (_) { /*expected*/ }
      const all = await this.getAll(SELF_TEST_STORE, isDummyObj, null)
      if ( all.length !== 1 || all[0]?.id !== 'one' || all[0]?.foo !== 'bar' ) return false
      if ( (await this.get(SELF_TEST_STORE, 'one', isDummyObj)).foo !== 'bar' ) return false
      if ( await this.upd(SELF_TEST_STORE, new DummyObj('one','x'), new DummyObj('one','quz')) !== 'one' ) return false
      if ( (await this.get(SELF_TEST_STORE, 'one', isDummyObj)).foo !== 'quz' ) return false
      if ( (await this.getAll(SELF_TEST_STORE, isDummyObj, null)).length !== 1 ) return false
      try { await this.get(SELF_TEST_STORE, 'two', isDummyObj); return false } catch (_) { /*expected*/ }
      try { await this.upd(SELF_TEST_STORE, new DummyObj('two','x'), d1); return false } catch (_) { /*expected*/ }
      try { await this.del(SELF_TEST_STORE, new DummyObj('two','x')); return false } catch (_) { /*expected*/ }
      if ( await this.del(SELF_TEST_STORE, new DummyObj('one','x')) !== 'one' ) return false
      if ( (await this.getAll(SELF_TEST_STORE, isDummyObj, null)).length !== 0 ) return false
      return true
    }
    catch (ex) {
      console.error(ex)
      return false
    }
  }

  protected _allLocTemps :SamplingLocationTemplate[] = []
  /** All location templates, with their samples removed. */
  get allLocationTemplates() :Readonly<Readonly<SamplingLocationTemplate>[]> { return this._allLocTemps }
  protected _allSampTemps :SampleTemplate[] = []
  /** All sample templates. */
  get allSampleTemplates() :Readonly<Readonly<SampleTemplate>[]> { return this._allSampTemps }
  protected _allMeasTemps :MeasurementType[] = []
  /** All measurement templates. */
  get allMeasurementTemplates() :Readonly<Readonly<MeasurementType>[]> { return this._allMeasTemps }

  async updateTemplates() {  // this function is expensive
    const startMs = performance.now()
    const allTripTs = await this.tripTemplates().getAll(null)
    const allLoc = allTripTs.flatMap(([_,t]) => t.locations)
      .concat( ( await this.samplingTrips().getAll(null) ).flatMap(([_,t]) => t.locations.map(l => l.extractTemplate())) )
    // locations - no samples: assume users are just interested in the coordinates, not the samples at each location (helps deduplication!)
    this._allLocTemps = deduplicatedSet( allLoc.map(l => l.cloneNoSamples()) )
    this._allSampTemps = deduplicatedSet( allLoc.flatMap(l => l.samples.map(s => s.deepClone()))
      .concat( allTripTs.flatMap(([_,t]) => t.commonSamples) ) )
    this._allMeasTemps = deduplicatedSet( this._allSampTemps.flatMap(s => s.measurementTypes.map(m => m.deepClone())) )
    const durMs = performance.now() - startMs
    if (durMs>10) console.log('updateTemplates took', durMs, 'ms')
  }

}
