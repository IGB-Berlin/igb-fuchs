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
const FILE_STORE = 'files'
const FILE_TEST_STORE = '_files_self_test'

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
        req.result.createObjectStore(FILE_STORE, {})
        req.result.createObjectStore(FILE_TEST_STORE, {})
      }
    })
  }
  protected readonly db :IDBDatabase
  protected constructor(db :IDBDatabase) {
    this.db = db
  }
  private fileStore = FILE_STORE  // is temporarily changed to FILE_TEST_STORE for testing

  protected getAll<T extends HasId>(storeName :string, typeChecker :(o :HasId)=>o is T, except :T|null) {
    return new Promise<T[]>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readonly')
      trans.onerror = () => reject(trans.error)
      const req = trans.objectStore(storeName).getAll()
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        const rv :T[] = []
        const bad :unknown[] = []
        for (const o of req.result) {
          if (hasId(o) && typeChecker(o)) { if (except===null || except.id!==o.id) rv.push(o) }
          else bad.push(o)
        }
        console.debug('IDB getAll',storeName,'got',rv.length,'bad',bad.length)
        resolve(rv)
        if (bad.length) console.warn('Objects in',storeName,'that didn\'t pass checker',bad)
      }
    })
  }

  /** Returns a list of [key,File.name] */
  fileList() {
    return new Promise<[string,string][]>((resolve, reject) => {
      const trans = this.db.transaction([this.fileStore], 'readonly')
      trans.onerror = () => reject(trans.error)
      const req = trans.objectStore(this.fileStore).openCursor()
      req.onerror = () => reject(req.error)
      const rv :[string,string][] = []
      req.onsuccess = () => {
        const cur = req.result
        if (cur===null) {
          console.debug('IDB fileList',this.fileStore,rv.length)
          resolve(rv)
        }
        else {
          const key = cur.key
          const val :unknown = cur.value
          if (typeof key === 'string' && val instanceof File) rv.push([key, val.name])
          else console.error('Object in',this.fileStore,'with bad key',key,'or not a file',val)
          cur.continue()
        }
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
            console.warn('Object in',storeName,'with key',key,'didn\'t pass type checker',obj)
          }
        } else reject(new Error(`Key ${key} not found`))
      }
    })
  }

  getFile(key :string) {
    return new Promise<File>((resolve, reject) => {
      const trans = this.db.transaction([this.fileStore], 'readonly')
      trans.onerror = () => reject(trans.error)
      const req = trans.objectStore(this.fileStore).openCursor(key)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        if (req.result) {
          const obj :unknown = req.result.value
          if (obj instanceof File) {
            console.debug('IDB getFile',this.fileStore,key)
            resolve(obj)
          } else {
            console.error('Object in',this.fileStore,'that wasn\'t a file',obj)
            reject(new Error(`Object in ${this.fileStore} that wasn't a file ${String(obj)}`))
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

  addFile(key :string, file :File) {
    return new Promise<void>((resolve, reject) => {
      const trans = this.db.transaction([this.fileStore], 'readwrite')
      trans.onerror = () => reject(trans.error)
      trans.oncomplete = async () => {
        console.debug('IDB addFile', this.fileStore, key)
        resolve()
      }
      const req = trans.objectStore(this.fileStore).add(file, key)
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
        resolve(data.id)
        await this.updateTemplates()
      }
      const req1 = trans.objectStore(storeName).openCursor(data.id)
      req1.onerror = () => reject(req1.error)
      req1.onsuccess = () => {
        if (req1.result) {  // was found
          const req2 = req1.result.delete()
          req2.onerror = () => reject(req2.error)
          req2.onsuccess = () => console.debug('IDB del', storeName, data.id)
        }
        else reject(new Error(`Key ${data.id} not found`))
      }
    })
  }

  delFile(key :string) {
    return new Promise<void>((resolve, reject) => {
      const trans = this.db.transaction([this.fileStore], 'readwrite')
      trans.onerror = () => reject(trans.error)
      trans.oncomplete = async () => resolve()
      const req1 = trans.objectStore(this.fileStore).openCursor(key)
      req1.onerror = () => reject(req1.error)
      req1.onsuccess = () => {
        if (req1.result) {  // was found
          const req2 = req1.result.delete()
          req2.onerror = () => reject(req2.error)
          req2.onsuccess = () => console.debug('IDB delFile', this.fileStore, key)
        }
        else reject(new Error(`Key ${key} not found`))
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

  /** Test the functionality of IndexedDB so it doesn't blow up on the user later. */
  async selfTest() :Promise<boolean> {
    class DummyObj implements HasId {
      readonly id :string
      readonly foo :string
      constructor(id :string, foo :string) { this.id = id; this.foo = foo }
    }
    function isDummyObj(o :unknown) :o is DummyObj {
      return !!( hasId(o) && 'foo' in o && typeof o.foo === 'string' ) }
    console.log('Running storage test...')
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

      try { this.fileStore = FILE_TEST_STORE
        if ( (await this.fileList()).length !== 0 ) return false
        const f1 = new File(['Hello, World!'], 'test.txt', { type: 'text/plain' })
        await this.addFile('foo', f1)
        try { await this.addFile('foo', f1); return false } catch (_) { /*expected*/ }
        const fl1 = await this.fileList()
        if ( fl1.length!==1 || fl1[0]?.[0]!=='foo' || fl1[0]?.[1]!=='test.txt' ) return false
        const f1b = await this.getFile('foo')
        if ( f1b.name!=='test.txt' || await f1b.text() !== 'Hello, World!' ) return false
        await this.delFile('foo')
        try { await this.getFile('foo'); return false } catch (_) { /*expected*/ }
        try { await this.delFile('foo'); return false } catch (_) { /*expected*/ }
        if ( (await this.fileList()).length !== 0 ) return false
      }
      finally { this.fileStore = FILE_STORE }

      console.log('... storage test passed!')
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
    if (durMs>50) console.log('updateTemplates took', durMs, 'ms')
  }

}
