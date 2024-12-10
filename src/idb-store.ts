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
import { ISamplingTrip, ISamplingTripTemplate, isISamplingTrip, isISamplingTripTemplate, SamplingTrip, SamplingTripTemplate } from './types/trip'
import { SamplingLocation, SamplingLocationTemplate } from './types/location'
import { openDB, DBSchema, IDBPDatabase, StoreNames } from 'idb'
import { importOverwriteQuestion, yesNoDialog } from './dialogs'
import { hasId, timestampNow } from './types/common'
import { MeasurementType } from './types/meas-type'
import { SampleTemplate } from './types/sample'
import { deduplicatedSet } from './types/set'
import { AbstractStore} from './storage'
import { i18n, tr } from './i18n'
import { assert } from './utils'

const IDB_NAME = 'IGB-FUCHS'

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
class DummyObj implements IDummyObj {
  readonly id
  readonly foo
  constructor(o :IDummyObj) {
    this.id = o.id
    this.foo = o.foo
  }
}

interface MyDB extends DBSchema {
  selfTest :{ key :string, value :IDummyObj  },
  samplingTrips :{ key :string, value :ISamplingTrip },
  tripTemplates :{ key :string, value :ISamplingTripTemplate },
  filesTest :{ key :string, value :File },
  files :{ key :string, value :File },
  general :{ key :string, value :ISettings },
}

interface ISettings {
  hideBetaWarningUntilTimeMs :number
  hideHelpTexts :boolean
}
const DEFAULT_SETTINGS :ISettings = {
  hideBetaWarningUntilTimeMs: -Infinity,
  hideHelpTexts: false,
}
function isISettings(o :unknown) :o is ISettings {
  return !!( o && typeof o === 'object' && 'hideHelpTexts' in o && typeof o.hideHelpTexts === 'boolean' ) }

class Settings {
  static KEY = 'settings'
  private readonly db
  constructor(db :IDBPDatabase<MyDB>) { this.db = db }
  async get<K extends keyof ISettings = keyof ISettings>(key :K) :Promise<ISettings[K]> {
    const sett = await this.db.get('general', Settings.KEY) ?? DEFAULT_SETTINGS
    assert(isISettings(sett))
    return sett[key]
  }
  async set<K extends keyof ISettings = keyof ISettings>(key :K, val :ISettings[K]) :Promise<void> {
    const trans = this.db.transaction('general', 'readwrite')
    const cur = await trans.store.openCursor(Settings.KEY)
    if (cur) {
      assert(isISettings(cur.value))
      const sett = JSON.parse(JSON.stringify(cur.value)) as ISettings
      sett[key] = val
      await Promise.all([ cur.update(sett), trans.done ])
    }
    else {
      const sett = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as ISettings
      sett[key] = val
      await Promise.all([ trans.store.add(sett, Settings.KEY), trans.done ])
    }
  }
}

class FileStore {
  private readonly db
  private readonly storeName
  constructor(db :IDBPDatabase<MyDB>, storeName :StoreNames<MyDB>) {
    this.db = db
    this.storeName = storeName
  }
  async* asyncList() :AsyncGenerator<[string,string], void, void> {
    const tx = this.db.transaction(this.storeName)
    let goodCount = 0, badCount = 0
    for await (const cur of tx.store) {
      if (cur.value instanceof File) {
        yield [cur.key, cur.value.name]
        goodCount++
      }
      else {
        console.warn('Store', this.storeName, 'object at key', cur.key, 'didn\'t pass type checker', cur.value)
        badCount++
      }
    }
    console.debug('IDB file.asyncList',this.storeName,'got',goodCount,'bad',badCount)
  }
  async list() :Promise<[string,string][]> {
    const rv :[string,string][] = []
    for await (const f of this.asyncList()) rv.push(f)
    return rv
  }
  async get(key :string) :Promise<File> {
    const obj = await this.db.get(this.storeName, key)
    if (!obj) throw new Error(`Key ${key} not found`)
    if (obj instanceof File) {
      console.debug('IDB file.get', this.storeName, key, obj.name)
      return obj
    }
    throw new Error(`Store ${this.storeName} object at key ${key} wasn't a file (is ${typeof obj})`)
  }
  async add(key :string, file :File) :Promise<void> {
    await this.db.add(this.storeName, file, key)
    console.debug('IDB file.add', this.storeName, key, file.name)
  }
  async del(key :string) :Promise<void> {
    const trans = this.db.transaction(this.storeName, 'readwrite')
    const cur = await trans.store.openCursor(key)
    if (!cur) throw new Error(`Key ${key} not found`)
    await Promise.all([ trans.done, cur.delete() ])
    console.debug('IDB file.del', this.storeName, key)
  }
}

class TypedIdStore<I extends ISamplingTrip|ISamplingTripTemplate|IDummyObj, O extends I> extends AbstractStore<O> {
  private readonly db
  private readonly storeName
  private readonly typeChecker
  private readonly converter
  private readonly cbModified
  constructor(db :IDBPDatabase<MyDB>, storeName :StoreNames<MyDB>, typeChecker :(o:unknown)=>o is I, converter :(o:I)=>O, cbModified :(()=>Promise<void>)|null) {
    super()
    this.db = db
    this.storeName = storeName
    this.typeChecker = typeChecker
    this.converter = converter
    this.cbModified = cbModified
  }
  async *getAllAsync(except :I|null) :AsyncGenerator<[string,O], void, void> {
    const tx = this.db.transaction(this.storeName)
    let goodCount = 0, badCount = 0
    for await (const cur of tx.store) {
      if (this.typeChecker(cur.value)) {
        if (!except || except.id!==cur.value.id)
          yield [cur.key, this.converter(cur.value)]
        goodCount++
      } else {
        console.warn('IDB', this.storeName, 'object at key', cur.key, 'didn\'t pass type checker', cur.value)
        badCount++
      }
    }
    if (badCount)
      console.error('IDB getAllAsync',this.storeName,'got',goodCount,'bad',badCount)
  }
  override async getAll(except :I|null): Promise<[string,O][]> {
    const rv :[string,O][] = []
    // Array.fromAsync() was added in 2024, so wait a while before we use that...
    for await (const r of this.getAllAsync(except)) rv.push(r)
    //TODO Later: consider sorting .getAll results
    return rv
  }
  override async get(key :string) :Promise<O> {
    const obj = await this.db.get(this.storeName, key)
    if (!obj) throw new Error(`Key ${key} not found`)
    if (this.typeChecker(obj)) {
      console.debug('IDB get', this.storeName, obj.id)
      return this.converter(obj)
    }
    throw new Error(`Store ${this.storeName} object at key ${key} didn't pass type check (${JSON.stringify(obj)})`)
  }
  async tryGet(key :string) :Promise<O|null> {
    const obj = await this.db.get(this.storeName, key)
    if (obj===undefined) return null
    if (this.typeChecker(obj)) {
      console.debug('IGB tryGet', this.storeName, key)
      return this.converter(obj)
    } else console.warn('IDB', this.storeName, 'object at key', key, 'didn\'t pass type checker', obj)
    return null
  }
  override async add(obj :I) {
    if (isISamplingTrip(obj)) obj.lastModified = timestampNow()
    const rv = await this.db.add(this.storeName, obj)
    console.debug('IDB add', this.storeName, obj.id)
    if (this.cbModified) await this.cbModified()
    return rv
  }
  override async upd(prevObj :I, newObj :I) {
    if (prevObj.id !== newObj.id) throw new Error(`prevObj.id!==newObj.id: '${prevObj.id}'!=='${newObj.id}'`)
    const trans = this.db.transaction(this.storeName, 'readwrite')
    const cur = await trans.store.openCursor(prevObj.id)
    if (!cur) throw new Error(`Key ${prevObj.id} not found`)
    if (isISamplingTrip(newObj)) newObj.lastModified = timestampNow()
    await Promise.all([ trans.done, cur.update(newObj) ])
    console.debug('IDB upd', this.storeName, prevObj.id, newObj.id)
    if (this.cbModified) await this.cbModified()
    return newObj.id
  }
  override async del(obj :I) {
    const trans = this.db.transaction(this.storeName, 'readwrite')
    const cur = await trans.store.openCursor(obj.id)
    if (!cur) throw new Error(`Key ${obj.id} not found`)
    await Promise.all([ trans.done, cur.delete() ])
    console.debug('IDB del', this.storeName, obj.id)
    if (this.cbModified) await this.cbModified()
    return obj.id
  }
}

export class IdbStorage {
  // https://github.com/jakearchibald/idb#readme

  static newTripTemplateId() { return 'tripTemplate-'+crypto.randomUUID() }
  static newSamplingTripId() { return 'samplingTrip-'+crypto.randomUUID() }

  static async open() {
    return new IdbStorage( await openDB<MyDB>(IDB_NAME, 1, {
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

  private readonly db
  private readonly selfTestStore
  private readonly fileTestStore
  readonly tripTemplates
  readonly samplingTrips
  readonly fileStore
  readonly settings
  private constructor(db :IDBPDatabase<MyDB>) {
    this.db = db
    this.selfTestStore = new TypedIdStore(db, 'selfTest', isIDummyObj, (o:IDummyObj)=>new DummyObj(o), null)
    this.fileTestStore = new FileStore(db, 'filesTest')
    this.tripTemplates = new TypedIdStore(db, 'tripTemplates', isISamplingTripTemplate, (o:ISamplingTripTemplate)=>new SamplingTripTemplate(o), ()=>this.updateTemplates())
    this.samplingTrips = new TypedIdStore(db, 'samplingTrips', isISamplingTrip, (o:ISamplingTrip)=>new SamplingTrip(o), ()=>this.updateTemplates())
    this.fileStore = new FileStore(db, 'files')
    this.settings = new Settings(db)
  }

  private _allLocTemps :SamplingLocationTemplate[] = []
  /** All location templates, with their samples removed. */
  get allLocationTemplates() :Readonly<Readonly<SamplingLocationTemplate>[]> { return this._allLocTemps }
  private _allSampTemps :SampleTemplate[] = []
  /** All sample templates. */
  get allSampleTemplates() :Readonly<Readonly<SampleTemplate>[]> { return this._allSampTemps }
  private _allMeasTemps :MeasurementType[] = []
  /** All measurement templates. */
  get allMeasurementTemplates() :Readonly<Readonly<MeasurementType>[]> { return this._allMeasTemps }

  async updateTemplates() :Promise<void> {  // this function is expensive
    const startMs = performance.now()
    const allTripTs = await this.tripTemplates.getAll(null)
    const allLoc = allTripTs.flatMap(([_,t]) => t.locations)
      .concat( ( await this.samplingTrips.getAll(null) ).flatMap(([_,t]) =>
        t.locations.map(l => new SamplingLocation(l).extractTemplate())) )
    // locations - no samples: assume users are just interested in the coordinates, not the samples at each location (helps deduplication!)
    this._allLocTemps = deduplicatedSet( allLoc.map(l => new SamplingLocationTemplate(l).cloneNoSamples()) )
    this._allSampTemps = deduplicatedSet( allLoc.flatMap(l => l.samples.map(s => new SampleTemplate(s).deepClone()))
      .concat( allTripTs.flatMap(([_,t]) => t.commonSamples.map(s => new SampleTemplate(s)) ) ) )
    this._allMeasTemps = deduplicatedSet( this._allSampTemps.flatMap(s => s.measurementTypes.map(m => m.deepClone())) )
    const durMs = performance.now() - startMs
    if (durMs>50) console.log('updateTemplates took', durMs, 'ms')
  }

  async export() :Promise<AllData> {
    const data :AllData = { samplingTrips: {}, tripTemplates: {} }
    const stores = ['samplingTrips', 'tripTemplates'] as const
    const trans = this.db.transaction(stores, 'readonly')
    await Promise.all(stores.map(async storeName => {
      for await (const cur of trans.objectStore(storeName)) {
        if (cur.key in data[storeName])
          console.error('Export: duplicate key, the former will be clobbered:', data[storeName][cur.key], cur.value)
        data[storeName][cur.key] = isISamplingTrip(cur.value) ? new SamplingTrip(cur.value).toJSON('')
          : isISamplingTripTemplate(cur.value) ? new SamplingTripTemplate(cur.value).toJSON('')
            : cur.value  // NOTE this is intentional, to still allow *all* objects to be exported after schema changes
      } }) )
    return data
  }

  async import(data :unknown) :Promise<ImportResults> {
    /* Note in this function I'm only translating those messages that are *likely* to happen.
     * I'm also not using a single transaction for everything because that wouldn't work; the
     * docs for `idb` say: "Do not await other things between the start and end of your
     * transaction, otherwise the transaction will close before you're done. An IDB transaction
     * auto-closes if it doesn't have anything left do once microtasks have been processed."
     * Since we may need to `await` overwrite confirmation dialogs, it would fail. */
    if (!data || typeof data !== 'object') return { errors: ['Not a JSON object.'], info: [] }
    const rv :ImportResults = { info: [], errors: [] }

    if ('samplingTrips' in data && data.samplingTrips && typeof data.samplingTrips==='object') {
      let counter = 0
      await Promise.all(Object.entries(data.samplingTrips).map(async ([k,v]) => {
        if (!isISamplingTrip(v)) { rv.errors.push(`${tr('import-bad-trip')}: ${k} (${tr('import-bad-explain')})`); return }
        if (v.id!==k) rv.errors.push(`Key mismatch: key=${k}, id=${v.id}, using id`)
        try {
          const imp = new SamplingTrip(v)
          const have = await this.samplingTrips.tryGet(v.id)
          if (have) {
            if (have.equals(v)) { counter++ }  // nothing needed, but just report it as imported b/c I think that's better info for the user (?)
            else if ( (await yesNoDialog(importOverwriteQuestion(have,imp),tr('Import Data'),false,false)) == 'yes' ) {
              await this.samplingTrips.add(imp); counter++ }
          }
          else { await this.samplingTrips.add(imp); counter++ }
        } catch (ex) { rv.errors.push(`Key ${v.id}: ${String(ex)}`) }
      }))
      rv.info.push(i18n.t('import-trip-info', { count: counter }))
    } else rv.errors.push('No samplingTrips in file, or bad format.')

    if ('tripTemplates' in data && data.tripTemplates && typeof data.tripTemplates==='object') {
      let counter = 0
      await Promise.all(Object.entries(data.tripTemplates).map(async ([k,v]) => {
        if (!isISamplingTripTemplate(v)) { rv.errors.push(`${tr('import-bad-temp')}: ${k} (${tr('import-bad-explain')})`); return }
        if (v.id!==k) rv.errors.push(`Key mismatch: key=${k}, id=${v.id}, using id`)
        try {
          const imp = new SamplingTripTemplate(v)
          const have = await this.tripTemplates.tryGet(v.id)
          if (have) {
            if (have.equals(v)) { counter++ }
            else if ( (await yesNoDialog(importOverwriteQuestion(have,imp),tr('Import Data'),false,false)) == 'yes' ) {
              await this.tripTemplates.add(imp); counter++ }
          }
          else { await this.tripTemplates.add(imp); counter++ }
        } catch (ex) { rv.errors.push(`Key ${v.id}: ${String(ex)}`) }
      }))
      rv.info.push(i18n.t('import-temp-info', { count: counter }))
    } else rv.errors.push('No tripTemplates in file, or bad format.')

    return rv
  }

  async selfTest() :Promise<boolean> {
    console.log('Running storage test...')
    try {
      if ( (await this.selfTestStore.getAll(null)).length!==0 ) return false
      const d1 = new DummyObj({ id: 'one', foo: 'bar' })
      try { await this.selfTestStore.upd(d1, d1); return false } catch (_) { /*expected*/ }
      if ( await this.selfTestStore.add(d1) !== 'one') return false
      try { await this.selfTestStore.add(d1); return false } catch (_) { /*expected*/ }
      const all = await this.selfTestStore.getAll(null)
      if ( all.length!==1 || all[0]?.[0]!=='one' || all[0]?.[1]?.id!=='one' || all[0]?.[1]?.foo!=='bar' ) return false
      if ( (await this.selfTestStore.get('one')).foo !== 'bar' ) return false
      const d1x = new DummyObj({ id: 'one', foo: 'x' })
      const d1b = new DummyObj({ id: 'one', foo: 'quz' })
      if ( await this.selfTestStore.upd(d1x, d1b) !== 'one' ) return false
      if ( (await this.selfTestStore.get('one')).foo !== 'quz' ) return false
      if ( (await this.selfTestStore.getAll(null)).length !== 1 ) return false
      try { await this.selfTestStore.get('two'); return false } catch (_) { /*expected*/ }
      const d2 = new DummyObj({ id: 'two', foo: 'y' })
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

      console.log('... storage test passed!')
      return true
    }
    catch (ex) {
      console.error(ex)
      return false
    }
  }

}
