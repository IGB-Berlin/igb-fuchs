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
import { ISamplingTrip, ISamplingTripTemplate, isISamplingTrip, isISamplingTripTemplate, SamplingTrip, SamplingTripTemplate } from './types/trip'
import { SamplingLocation, SamplingLocationTemplate } from './types/location'
import { openDB, DBSchema, IDBPDatabase, StoreNames } from 'idb'
import { AbstractStore, HasId, hasId } from './storage'
import { HasHtmlSummary } from './editors/list-dialog'
import { MeasurementType } from './types/meas-type'
import { SampleTemplate } from './types/sample'
import { deduplicatedSet } from './types/set'
import { yesNoDialog } from './dialogs'
import { i18n, tr } from './i18n'

const IDB_NAME = 'IGB-Field'
const SELF_TEST_STORE = '_self_test'
const SAMP_TRIPS = 'sampling-trips'
const TRIP_TEMPLATES = 'trip-templates'
const FILE_STORE = 'files'
const FILE_TEST_STORE = '_files_self_test'

interface AllData {
  samplingTrips: { [key :string]: ISamplingTrip }
  tripTemplates: { [key :string]: ISamplingTripTemplate }
}

interface ImportResults {
  errors :string[]
  info :string[]
}

interface IDummyObj {
  readonly id :string
  readonly foo :string
}
function isIDummyObj(o :unknown) :o is IDummyObj {
  return !!( hasId(o) && 'foo' in o && typeof o.foo === 'string' ) }

interface IPlaceholder {  // reserved for settings etc. later
  something :string
}
/*function isIPlaceholder(o :unknown) :o is IPlaceholder {
  return !!( o && typeof o === 'object' ) }*/

interface MyDB extends DBSchema {
  selfTest :{ key :string, value :IDummyObj  },
  samplingTrips :{ key :string, value :ISamplingTrip },
  tripTemplates :{ key :string, value :ISamplingTripTemplate },
  filesTest :{ key :string, value :File },
  files :{ key :string, value :File },
  general :{ key :string, value :IPlaceholder },
}

//type Class<T> = new (...args: unknown[]) => T
type TypeChecker<T> = (o :unknown) => o is T

class FileStore {
  private readonly db :IDBPDatabase<MyDB>
  private readonly storeName :StoreNames<MyDB>
  constructor(db :IDBPDatabase<MyDB>, storeName :StoreNames<MyDB>) {
    this.db = db
    this.storeName = storeName
  }
  async list() :Promise<[string,string][]> {
    const rv :[string,string][] = []
    for await (const f of this.asyncList()) rv.push(f)
    return rv
  }
  async* asyncList() :AsyncGenerator<[string,string], void, void> {
    const tx = this.db.transaction(this.storeName)
    for await (const cur of tx.store) {
      if (cur.value instanceof File)
        yield [cur.key, cur.value.name]
      else console.warn('Store', this.storeName, 'object at key', cur.key, 'didn\'t pass type checker', cur.value)
    }
  }
  async get(key :string) :Promise<File> {
    const obj = await this.db.get(this.storeName, key)
    if (!obj) throw new Error(`Key ${key} not found`)
    if (obj instanceof File) return obj
    throw new Error(`Store ${this.storeName} object at key ${key} wasn't a file (is ${typeof obj})`)
  }
  async add(key :string, file :File) :Promise<void> {
    await this.db.add(this.storeName, file, key)
  }
  async del(key :string) :Promise<void> {
    const trans = this.db.transaction(this.storeName, 'readwrite')
    const cur = await trans.store.openCursor(key)
    if (!cur)  throw new Error(`Key ${key} not found`)
    await Promise.all([ trans.done, cur.delete() ])
  }
}

class TypedIdStore<T extends ISamplingTrip|ISamplingTripTemplate|IDummyObj> extends AbstractStore<T> {
  private readonly db :IDBPDatabase<MyDB>
  private readonly storeName :StoreNames<MyDB>
  private readonly typeChecker :TypeChecker<T>
  private readonly modifyCallback :(()=>Promise<void>)|null
  constructor(db :IDBPDatabase<MyDB>, storeName :StoreNames<MyDB>, typeChecker :TypeChecker<T>, modifyCallback :(()=>Promise<void>)|null) {
    super()
    this.db = db
    this.storeName = storeName
    this.typeChecker = typeChecker
    this.modifyCallback = modifyCallback
  }
  newId() :string { return crypto.randomUUID() }
  async *getAllAsync(except :T|null) :AsyncGenerator<[string,T], void, void> {
    const tx = this.db.transaction(this.storeName)
    for await (const cur of tx.store) {
      if (this.typeChecker(cur.value)) {
        if (!except || except.id!==cur.value.id)
          yield [cur.key, cur.value]
      } else console.warn('Store', this.storeName, 'object at key', cur.key, 'didn\'t pass type checker', cur.value)
    }
  }
  override async getAll(except :T|null): Promise<[string,T][]> {
    const rv :[string,T][] = []
    // Array.fromAsync() was added in 2024, so wait a while before we use that...
    for await (const r of this.getAllAsync(except)) rv.push(r)
    return rv
  }
  override async get(key :string) :Promise<T> {
    const obj = await this.db.get(this.storeName, key)
    if (!obj) throw new Error(`Key ${key} not found`)
    if (this.typeChecker(obj)) return obj
    throw new Error(`Store ${this.storeName} object at key ${key} didn't pass type check (${JSON.stringify(obj)})`)
  }
  protected override async _add(obj :T) {
    const rv = await this.db.add(this.storeName, obj)
    if (this.modifyCallback) await this.modifyCallback()
    return rv
  }
  protected override async _upd(prevObj :T, newObj :T) {
    const trans = this.db.transaction(this.storeName, 'readwrite')
    const cur = await trans.store.openCursor(prevObj.id)
    if (!cur) throw new Error(`Key ${prevObj.id} not found`)
    await Promise.all([ trans.done, cur.update(newObj) ])
    if (this.modifyCallback) await this.modifyCallback()
    return newObj.id
  }
  protected override _mod(obj :T) {
    return this._upd(obj, obj)
  }
  protected override async _del(obj :T) {
    const trans = this.db.transaction(this.storeName, 'readwrite')
    const cur = await trans.store.openCursor(obj.id)
    if (!cur) throw new Error(`Key ${obj.id} not found`)
    await Promise.all([ trans.done, cur.delete() ])
    if (this.modifyCallback) await this.modifyCallback()
    return obj.id
  }
  async haveKey(key :string) {  //TODO: remove if unused
    const trans = this.db.transaction(this.storeName, 'readonly')
    return !!await trans.store.openKeyCursor(key)
  }
}

export class IdbStorage {  //TODO: switch from IndexedStorage to this

  static async open() {
    return new IdbStorage( await openDB<MyDB>(IDB_NAME+'2', 1, {  //TODO: remove the "2", it's for debugging
      upgrade(db) {
        db.createObjectStore('selfTest', { keyPath: 'id' })
        db.createObjectStore('tripTemplates', { keyPath: 'id' })
        db.createObjectStore('samplingTrips', { keyPath: 'id' })
        db.createObjectStore('filesTest', {})
        db.createObjectStore('files', {})
        db.createObjectStore('general', {})
      }
    }))
  }

  private readonly selfTestStore :TypedIdStore<IDummyObj>
  private readonly fileTestStore :FileStore
  readonly tripTemplates :TypedIdStore<ISamplingTripTemplate>
  readonly samplingTrips :TypedIdStore<ISamplingTrip>
  readonly fileStore :FileStore
  private constructor(db :IDBPDatabase<MyDB>) {
    this.selfTestStore = new TypedIdStore(db, 'selfTest', isIDummyObj, null)
    this.fileTestStore = new FileStore(db, 'filesTest')
    this.tripTemplates = new TypedIdStore(db, 'tripTemplates', isISamplingTripTemplate, ()=>this.updateTemplates())
    this.samplingTrips = new TypedIdStore(db, 'samplingTrips', isISamplingTrip, ()=>this.updateTemplates())
    this.fileStore = new FileStore(db, 'files')
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

  async updateTemplates() :Promise<void> {  // this function is expensive
    const startMs = performance.now()
    const allTripTs = await this.tripTemplates.getAll(null)
    const allLoc = allTripTs.flatMap(([_,t]) => t.locations)
      .concat( ( await this.samplingTrips.getAll(null) ).flatMap(([_,t]) =>
        t.locations.map(l => new SamplingLocation(l, null).extractTemplate())) )
    // locations - no samples: assume users are just interested in the coordinates, not the samples at each location (helps deduplication!)
    this._allLocTemps = deduplicatedSet( allLoc.map(l => new SamplingLocationTemplate(l).cloneNoSamples()) )
    this._allSampTemps = deduplicatedSet( allLoc.flatMap(l => l.samples.map(s => new SampleTemplate(s).deepClone()))
      .concat( allTripTs.flatMap(([_,t]) => t.commonSamples.map(s => new SampleTemplate(s)) ) ) )
    this._allMeasTemps = deduplicatedSet( this._allSampTemps.flatMap(s => s.measurementTypes.map(m => m.deepClone())) )
    const durMs = performance.now() - startMs
    if (durMs>50) console.log('updateTemplates took', durMs, 'ms')
  }

  async selfTest() :Promise<boolean> {
    try {
      if ( (await this.selfTestStore.getAll(null)).length!==0 ) return false
      const d1 :IDummyObj = { id: 'one', foo: 'bar' }
      try { await this.selfTestStore.upd(d1, d1); return false } catch (_) { /*expected*/ }
      if ( await this.selfTestStore.add(d1) !== 'one') return false
      try { await this.selfTestStore.add(d1); return false } catch (_) { /*expected*/ }
      const all = await this.selfTestStore.getAll(null)
      if ( all.length!==1 || all[0]?.[0]!=='one' || all[0]?.[1]?.id!=='one' || all[0]?.[1]?.foo!=='bar ') return false
      if ( (await this.selfTestStore.get('one')).foo !== 'bar' ) return false
      const d1x :IDummyObj = { id: 'one', foo: 'x' }
      const d1b :IDummyObj = { id: 'one', foo: 'quz' }
      if ( await this.selfTestStore.upd(d1x, d1b) !== 'one' ) return false
      if ( (await this.selfTestStore.get('one')).foo !== 'quz' ) return false
      if ( (await this.selfTestStore.getAll(null)).length !== 1 ) return false
      try { await this.selfTestStore.get('two'); return false } catch (_) { /*expected*/ }
      const d2 :IDummyObj = { id: 'two', foo: 'y' }
      try { await this.selfTestStore.upd(d2, d1); return false } catch (_) { /*expected*/ }
      try { await this.selfTestStore.del(d2); return false } catch (_) { /*expected*/ }
      if ( await this.selfTestStore.del(d1x) !== 'one' ) return false
      if ( (await this.selfTestStore.getAll(null)).length!==0 ) return false

      if ( (await this.fileTestStore.list()).length !== 0 ) return false
      const f1 = new File(['Hello, World!'], 'test.txt', { type: 'text/plain' })
      await this.fileTestStore.add('foo', f1)
      try { await this.fileTestStore.add('foo', f1); return false } catch (_) { /*expected*/ }
      const fl1 = await this.fileTestStore.list()
      if ( fl1.length!==1 || fl1[0]?.[0]!=='foo' || fl1[0]?.[1]!=='test.txt' ) return false
      const f1b = await this.fileTestStore.get('foo')
      if ( f1b.name!=='test.txt' || await f1b.text() !== 'Hello, World!' ) return false
      await this.fileTestStore.del('foo')
      try { await this.fileTestStore.get('foo'); return false } catch (_) { /*expected*/ }
      try { await this.fileTestStore.del('foo'); return false } catch (_) { /*expected*/ }
      if ( (await this.fileTestStore.list()).length !== 0 ) return false

      return true
    }
    catch (ex) {
      console.error(ex)
      return false
    }
  }

}

export class IndexedStorage {

  static newTripTemplateId() :string { return crypto.randomUUID() }
  static newSamplingTripId() :string { return crypto.randomUUID() }

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

  export() :Promise<AllData> {
    return new Promise<AllData>((resolve, reject) => {
      const trans = this.db.transaction([SAMP_TRIPS, TRIP_TEMPLATES], 'readonly')
      trans.onerror = () => reject(trans.error)

      const data :AllData = { samplingTrips: {}, tripTemplates: {} }
      let tripDone = false, tempDone = false
      const maybeDone = () => { if (tripDone && tempDone) resolve(data) }

      const tripReq = trans.objectStore(SAMP_TRIPS).openCursor()
      tripReq.onerror = () => reject(tripReq.error)
      tripReq.onsuccess = () => {
        const cur = tripReq.result
        if (cur===null) { tripDone = true; maybeDone() }
        else {
          const key = cur.key
          if (typeof key==='string') {
            if (key in data.samplingTrips)
              console.error('Export: duplicate key, the latter will be clobbered:', data.samplingTrips[key], cur.value)
            // NOTE we're intentionally not type checking here, to allow export of objects after schema changes
            data.samplingTrips[key] = cur.value as ISamplingTrip
          } else console.error('Export: ignoring bad key (not string)',key)
          cur.continue()
        }
      }

      const tempReq = trans.objectStore(TRIP_TEMPLATES).openCursor()
      tempReq.onerror = () => reject(tempReq.error)
      tempReq.onsuccess = () => {
        const cur = tempReq.result
        if (cur===null) { tempDone = true; maybeDone() }
        else {
          const key = cur.key
          if (typeof key==='string') {
            if (key in data.tripTemplates)
              console.error('Export: duplicate key, the latter will be clobbered:', data.tripTemplates[key], cur.value)
            data.tripTemplates[key] = cur.value as ISamplingTripTemplate
          } else console.error('Export: ignoring bad key (not string)',key)
          cur.continue()
        }
      }
    })
  }

  async import(data :unknown) :Promise<ImportResults> {
    /* Note in this function I'm only translating those messages that are *likely* to happen.
     * I'm also not doing everything in a single transaction because I think that's probably overkill. */
    if (!data || typeof data !== 'object') return { errors: ['Not a JSON object.'], info: [] }
    const rv :ImportResults = { info: [], errors: [] }
    const makeOverwriteQ = (have :HasHtmlSummary, inp :HasHtmlSummary) :HTMLElement => {
      const f = document.createElement('div')
      // question
      const q = document.createElement('p')
      q.classList.add('fw-bold','text-danger-emphasis')
      q.innerText = tr('import-overwrite')
      f.appendChild(q)
      // existing obj
      const h = have.summaryAsHtml(true)  // we know this is a flex-row div
      h.classList.add('mb-3')
      const hl = document.createElement('div')
      hl.classList.add('fw-semibold','text-success-emphasis')
      hl.innerText = tr('Existing object')+':'
      h.insertAdjacentElement('afterbegin', hl)
      f.appendChild(h)
      // imported obj
      const i = inp.summaryAsHtml(true)
      const il = document.createElement('div')
      il.classList.add('fw-semibold','text-warning-emphasis')
      il.innerText = tr('Imported object')+':'
      i.insertAdjacentElement('afterbegin', il)
      f.appendChild(i)
      return f
    }
    if ('samplingTrips' in data && data.samplingTrips && typeof data.samplingTrips==='object') {
      let counter = 0
      await Promise.all(Object.entries(data.samplingTrips).map(async ([k,v]) => {
        if (!isISamplingTrip(v)) { rv.errors.push(`${tr('import-bad-trip')}: ${k}`); return }
        if (v.id!==k) rv.errors.push(`Key mismatch: key=${k}, id=${v.id}, using id`)
        try {
          if (await this.haveKey(SAMP_TRIPS, v.id)) {
            const have = new SamplingTrip( await this.get(SAMP_TRIPS, v.id, isISamplingTrip), null )
            if (have.equals(v)) { counter++ }  // nothing needed, but just report it as imported b/c I think that's better info for the user (?)
            else {
              const inp = new SamplingTrip(v, null)
              const yesNo = await yesNoDialog(makeOverwriteQ(have,inp),tr('Import Data'),false,false)
              if (yesNo==='yes') { await this.upd(SAMP_TRIPS, have, inp); counter++ }
            }
          } else { await this.add(SAMP_TRIPS, v); counter++ }
        } catch (ex) { rv.errors.push(`Key ${v.id}: ${String(ex)}`) }
      }))
      rv.info.push(i18n.t('import-trip-info', { count: counter }))
    } else rv.errors.push('No samplingTrips in file, or bad format.')
    if ('tripTemplates' in data && data.tripTemplates && typeof data.tripTemplates==='object') {
      let counter = 0
      await Promise.all(Object.entries(data.tripTemplates).map(async ([k,v]) => {
        if (!isISamplingTripTemplate(v)) { rv.errors.push(`${tr('import-bad-temp')}: ${k}`); return }
        if (v.id!==k) rv.errors.push(`Key mismatch: key=${k}, id=${v.id}, using id`)
        try {
          if (await this.haveKey(TRIP_TEMPLATES, v.id)) {
            const have = new SamplingTripTemplate( await this.get(TRIP_TEMPLATES, v.id, isISamplingTripTemplate) )
            if (have.equals(v)) { counter++ }
            else {
              const inp = new SamplingTripTemplate(v)
              const yesNo = await yesNoDialog(makeOverwriteQ(have,inp),tr('Import Data'),false,false)
              if (yesNo==='yes') { await this.upd(TRIP_TEMPLATES, have, inp); counter++ }
            }
          } else { await this.add(TRIP_TEMPLATES, v); counter++ }
        } catch (ex) { rv.errors.push(`Key ${v.id}: ${String(ex)}`) }
      }))
      rv.info.push(i18n.t('import-temp-info', { count: counter }))
    } else rv.errors.push('No tripTemplates in file, or bad format.')
    return rv
  }

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

  protected haveKey(storeName :string, key :string) {
    return new Promise<boolean>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readonly')
      trans.onerror = () => reject(trans.error)
      const req = trans.objectStore(storeName).openKeyCursor(key)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(!!req.result)
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
    console.log('Running storage test...')
    try {
      if ( (await this.getAll(SELF_TEST_STORE, isIDummyObj, null)).length !== 0 ) return false
      const d1 :IDummyObj = { id: 'one', foo: 'bar' }
      try { await this.upd(SELF_TEST_STORE, d1, d1); return false } catch (_) { /*expected*/ }
      if ( await this.add(SELF_TEST_STORE, d1) !== 'one' ) return false
      try { await this.add(SELF_TEST_STORE, d1); return false } catch (_) { /*expected*/ }
      const all = await this.getAll(SELF_TEST_STORE, isIDummyObj, null)
      if ( all.length !== 1 || all[0]?.id !== 'one' || all[0]?.foo !== 'bar' ) return false
      if ( (await this.get(SELF_TEST_STORE, 'one', isIDummyObj)).foo !== 'bar' ) return false
      if ( await this.upd(SELF_TEST_STORE, { id: 'one', foo: 'x' } as IDummyObj, { id: 'one', foo: 'quz' } as IDummyObj) !== 'one' ) return false
      if ( (await this.get(SELF_TEST_STORE, 'one', isIDummyObj)).foo !== 'quz' ) return false
      if ( (await this.getAll(SELF_TEST_STORE, isIDummyObj, null)).length !== 1 ) return false
      try { await this.get(SELF_TEST_STORE, 'two', isIDummyObj); return false } catch (_) { /*expected*/ }
      try { await this.upd(SELF_TEST_STORE, { id: 'two', foo: 'x' } as IDummyObj, d1); return false } catch (_) { /*expected*/ }
      try { await this.del(SELF_TEST_STORE, { id: 'two', foo: 'x' } as IDummyObj); return false } catch (_) { /*expected*/ }
      if ( await this.del(SELF_TEST_STORE, { id: 'one', foo: 'x' } as IDummyObj) !== 'one' ) return false
      if ( (await this.getAll(SELF_TEST_STORE, isIDummyObj, null)).length !== 0 ) return false

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
