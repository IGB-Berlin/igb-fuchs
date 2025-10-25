/** This file is part of IGB-FUCHS.
 *
 * Copyright © 2024-2025 Hauke Dämpfling (haukex@zero-g.net)
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
import { ISamplingLog, ISamplingProcedure, isISamplingLog, isISamplingProcedure, SamplingLog, SamplingProcedure } from './types/sampling'
import { dateTimeToLocalFilenameString, dateToLocalString } from './editors/date-time'
import { SamplingLocation, SamplingLocationTemplate } from './types/location'
import { hasId, isTimestampSet, timestampNow } from './types/common'
import { openDB, DBSchema, IDBPDatabase, StoreNames } from 'idb'
import { importOverwriteQuestion, yesNoDialog } from './dialogs'
import { Validator, Schema } from '@cfworker/json-schema'
import FUCHS_SCHEMA from './types/igb-fuchs.schema.json'
import { MeasurementType } from './types/measurement'
import { SampleTemplate } from './types/sample'
import { deduplicatedSet } from './types/set'
import { AbstractStore} from './storage'
import { i18n, tr } from './i18n'
import { assert } from './utils'

const VALIDATOR = new Validator(FUCHS_SCHEMA as Schema, '7', false)

const IDB_NAME = 'IGB-FUCHS'
const JSON_COMMENT = 'This is a data file for IGB-FUCHS: https://fuchs.igb-berlin.de/' as const
const SCHEMA_URL = 'https://fuchs.igb-berlin.de/igb-fuchs.schema.json' as const

interface JsonFileFormat {
  _comment :typeof JSON_COMMENT,
  $schema :typeof SCHEMA_URL
  version :0,
  samplingLogs: { [key :string]: ISamplingLog }
  samplingProcedures: { [key :string]: ISamplingProcedure }
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
  return hasId(o) && 'foo' in o && typeof o.foo === 'string' }
class DummyObj implements IDummyObj {
  readonly id
  readonly foo
  constructor(o :IDummyObj) {
    this.id = o.id
    this.foo = o.foo
  }
}

/** Silly workaround for WebKit not supporting storing Blobs in IndexedDB in private windows, which causes Playwright tests to fail. */
interface IFakeFile {
  readonly name :string
  readonly type :string
  readonly last :number
  readonly data :ArrayBuffer
}
const isIFakeFile = (o :unknown) :o is IFakeFile =>
  !!( o && typeof o === 'object' && Object.keys(o).length===4 && 'name' in o && 'type' in o && 'last' in o && 'data' in o
    && typeof o.name === 'string' && typeof o.type === 'string' && typeof o.last === 'number' && o.data instanceof ArrayBuffer )
const file2fake = async (f :File) :Promise<IFakeFile> => ({ name: f.name, type: f.type, last: f.lastModified, data: await f.arrayBuffer() })
const fake2file = (f :IFakeFile) => new File([f.data], f.name, { type: f.type, lastModified: f.last })

interface MyDB extends DBSchema {
  selfTest :{ key :string, value :IDummyObj  },
  samplingLogs :{ key :string, value :ISamplingLog },
  samplingProcedures :{ key :string, value :ISamplingProcedure },
  filesTest :{ key :string, value :File|IFakeFile },
  files :{ key :string, value :File|IFakeFile },
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

export function makeFilename(obj :SamplingProcedure|SamplingLog|null, ext :'json'|'csv'|'zip') :string {
  const now = dateTimeToLocalFilenameString(new Date())
  return ( obj instanceof SamplingProcedure ? `${obj.name.trim().length ? obj.name : '(unnamed)'}.${now}.fuchs-procedure`
    : obj instanceof SamplingLog ? (obj.name.trim().length ? obj.name : '(unnamed)')
        +(isTimestampSet(obj.startTime) ? '_'+dateToLocalString(new Date(obj.startTime)) : '')+'.'
        +dateTimeToLocalFilenameString( isTimestampSet(obj.lastModified) ? new Date(obj.lastModified) : new Date() )+'.fuchs-log'
      : `FUCHS.${now}.full-export` ) + '.'+ext
}

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
      if (cur.value instanceof File || isIFakeFile(cur.value)) {
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
    if (obj instanceof File || isIFakeFile(obj)) {
      console.debug('IDB file.get', this.storeName, key, obj.name)
      return obj instanceof File ? obj : fake2file(obj)
    }
    else throw new Error(`Store ${this.storeName} object at key ${key} wasn't a file (is ${typeof obj})`)
  }
  async add(key :string, file :File) :Promise<void> {
    // easier to just always store as "fake" file object (regular file objects don't work in WebKit private window, e.g. Playwright test case)
    await this.db.add(this.storeName, await file2fake(file), key)
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

class TypedIdStore<I extends ISamplingLog|ISamplingProcedure|IDummyObj, O extends I> extends AbstractStore<O> {
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
    const o = rv[0]?.[1]
    if (o instanceof SamplingLog)
      rv.sort((a,b) => (a[1] as SamplingLog).logId.localeCompare((b[1] as SamplingLog).logId))
    else if (o instanceof SamplingProcedure)
      rv.sort((a,b) => (a[1] as SamplingProcedure).name.localeCompare((b[1] as SamplingProcedure).name))
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
    if (isISamplingLog(obj)) obj.lastModified = timestampNow()
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
    if (isISamplingLog(newObj)) newObj.lastModified = timestampNow()
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

  static newSamplingProcedureId() { return 'procedure-'+crypto.randomUUID() }
  static newSamplingLogId() { return 'sampLog-'+crypto.randomUUID() }

  static async open() {
    const storage = new IdbStorage(await openDB<MyDB>(IDB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('selfTest', { keyPath: 'id' })
        db.createObjectStore('samplingProcedures', { keyPath: 'id' })
        db.createObjectStore('samplingLogs', { keyPath: 'id' })
        db.createObjectStore('filesTest', {})
        db.createObjectStore('files', {})
        db.createObjectStore('general', {})
      }
    }))
    if (!await storage.selfTest()) throw new Error('Self test failed, see log')
    await storage.updateTemplates()
    return storage
  }

  private readonly db
  private readonly selfTestStore
  private readonly fileTestStore
  readonly samplingProcedures
  readonly samplingLogs
  readonly fileStore
  readonly settings
  private constructor(db :IDBPDatabase<MyDB>) {
    this.db = db
    this.selfTestStore = new TypedIdStore(db, 'selfTest', isIDummyObj, (o:IDummyObj)=>new DummyObj(o), null)
    this.fileTestStore = new FileStore(db, 'filesTest')
    this.samplingProcedures = new TypedIdStore(db, 'samplingProcedures', isISamplingProcedure, (o:ISamplingProcedure)=>new SamplingProcedure(o), ()=>this.updateTemplates())
    this.samplingLogs = new TypedIdStore(db, 'samplingLogs', isISamplingLog, (o:ISamplingLog)=>new SamplingLog(o), ()=>this.updateTemplates())
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
    const allProcedures = await this.samplingProcedures.getAll(null)
    const allLocTemps = allProcedures.flatMap(([_,t]) => t.locations)
      .concat( ( await this.samplingLogs.getAll(null) ).flatMap(([_,t]) =>
        t.locations.map(l => new SamplingLocation(l).extractTemplate())) )
    // locations - no samples: assume users are just interested in the coordinates, not the samples at each location (helps deduplication!)
    this._allLocTemps = deduplicatedSet( allLocTemps.map(l => new SamplingLocationTemplate(l).cloneNoSamples()) )
    this._allSampTemps = deduplicatedSet( allLocTemps.flatMap(l => l.samples.map(s => new SampleTemplate(s).deepClone()))
      .concat( allProcedures.flatMap(([_,t]) => t.commonSamples.map(s => new SampleTemplate(s)) ) ) )
    this._allMeasTemps = deduplicatedSet( this._allSampTemps.flatMap(s => s.measurementTypes.map(m => m.deepClone())) )
    const durMs = performance.now() - startMs
    if (durMs>50) console.log('updateTemplates took', durMs, 'ms')
  }

  async export() :Promise<File> {
    const data :JsonFileFormat = { _comment: JSON_COMMENT, $schema: SCHEMA_URL, version: 0, samplingLogs: {}, samplingProcedures: {} }
    const stores = ['samplingLogs', 'samplingProcedures'] as const
    const trans = this.db.transaction(stores, 'readonly')
    await Promise.all(stores.map(async storeName => {
      for await (const cur of trans.objectStore(storeName)) {
        if (cur.key in data[storeName])
          console.error('Export: duplicate key, the former will be clobbered:', data[storeName][cur.key], cur.value)
        // use .toJSON here because, unlike the objects, it'll omit unused fields for cleaner JSON
        data[storeName][cur.key] = isISamplingLog(cur.value) ? new SamplingLog(cur.value).toJSON('')
          : isISamplingProcedure(cur.value) ? new SamplingProcedure(cur.value).toJSON('')
            : cur.value  // NOTE this is intentional, to still allow *all* objects to be exported after schema changes
      } }) )
    this.schemaValidate(data)
    return new File( [JSON.stringify( data, null, 2 )], makeFilename(null,'json'), { type: 'application/json' } )
  }

  // This could be static but whatever
  exportOne(obj :SamplingProcedure|SamplingLog) :File {
    const data :JsonFileFormat = { _comment: JSON_COMMENT, $schema: SCHEMA_URL, version: 0, samplingLogs: {}, samplingProcedures: {} }
    if (obj instanceof SamplingProcedure) data.samplingProcedures[obj.id] = obj
    else data.samplingLogs[obj.id] = obj
    this.schemaValidate(data)
    return new File( [JSON.stringify( data, null, 2 )], makeFilename(obj,'json'), { type: 'application/json' } )
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

    this.schemaValidate(data)

    let ver :number = -1
    if ('version' in data) {
      if (typeof data.version === 'number') {
        if (Math.floor(data.version)!==data.version)  // not an int
          rv.errors.push(`Version not an integer: '${data.version}'`)
        else ver = data.version
      } else rv.errors.push(`Version isn't (stored as) a number: '${String(data.version)}'`)
    } else ver = 0  // versions up to v0.0.3-alpha didn't include `version: 0` in data
    if (ver!==0) {
      rv.errors.push(`Import failed: Unsupported data version ${String(ver)}`)
      return rv
    }

    if ('samplingLogs' in data && data.samplingLogs && typeof data.samplingLogs==='object') {
      let counter = 0
      console.debug('Import samplingLogs',Object.keys(data.samplingLogs).length,'keys')
      await Promise.all(Object.entries(data.samplingLogs).map(async ([k,v]) => {
        if (!isISamplingLog(v)) {
          console.warn('Import key',k,'NOT isISamplingLog:',v)
          rv.errors.push(`${tr('import-bad-log')}: ${k} (${tr('import-bad-explain')})`)
          return }
        if (v.id!==k) {
          console.warn('Key mismatch, key',k,'value',v)
          rv.errors.push(`Key mismatch: key=${k}, id=${v.id}, using id`) }
        try {
          const imp = new SamplingLog(v)
          const have = await this.samplingLogs.tryGet(v.id)
          if (have) {
            if (have.equals(v)) {  // nothing needed, but just report it as imported b/c I think that's better info for the user (?)
              console.debug('Import key',k,'already have this samplingLog (.equals match)')
              counter++ }
            else {
              console.debug('Import key',k,'asking user: have',have,'importing',imp)
              if ( (await yesNoDialog(importOverwriteQuestion(have,imp),tr('Import Data'),false,false)) == 'yes' ) {
                await this.samplingLogs.upd(have,imp); counter++ } }
          }
          else { await this.samplingLogs.add(imp); counter++ }
        } catch (ex) {
          console.warn('Error on key',k,ex)
          rv.errors.push(`Key ${v.id}: ${String(ex)}`) }
      }))
      rv.info.push(i18n.t('import-logs-info', { count: counter }))
    } else {
      console.warn('No samplingLogs in file, or bad format:',data)
      rv.errors.push('No samplingLogs in file, or bad format.')
    }

    if ('samplingProcedures' in data && data.samplingProcedures && typeof data.samplingProcedures==='object') {
      let counter = 0
      console.debug('Import samplingProcedures',Object.keys(data.samplingProcedures).length,'keys')
      await Promise.all(Object.entries(data.samplingProcedures).map(async ([k,v]) => {
        if (!isISamplingProcedure(v)) {
          console.warn('Import key',k,'NOT isISamplingProcedure:',v)
          rv.errors.push(`${tr('import-bad-proc')}: ${k} (${tr('import-bad-explain')})`)
          return }
        if (v.id!==k) {
          console.warn('Key mismatch, key',k,'value',v)
          rv.errors.push(`Key mismatch: key=${k}, id=${v.id}, using id`) }
        try {
          const imp = new SamplingProcedure(v)
          const have = await this.samplingProcedures.tryGet(v.id)
          if (have) {
            if (have.equals(v)) {
              console.debug('Import key',k,'already have this samplingProcedure (.equals match)')
              counter++ }
            else {
              console.debug('Import key',k,'asking user: have',have,'importing',imp)
              if ( (await yesNoDialog(importOverwriteQuestion(have,imp),tr('Import Data'),false,false)) == 'yes' ) {
                await this.samplingProcedures.upd(have,imp); counter++ } }
          }
          else { await this.samplingProcedures.add(imp); counter++ }
        } catch (ex) {
          console.warn('Error on key',k,ex)
          rv.errors.push(`Key ${v.id}: ${String(ex)}`) }
      }))
      rv.info.push(i18n.t('import-proc-info', { count: counter }))
    } else {
      console.warn('No samplingProcedures in file, or bad format:',data)
      rv.errors.push('No samplingProcedures in file, or bad format.')
    }

    return rv
  }

  /** For now, this is just for testing our schema. */
  private schemaValidate(data :unknown) {
    try {
      const results = VALIDATOR.validate(data)
      if (results.valid) console.debug('Schema validation passed')
      else console.warn('Schema validation failed', results.errors)
    }
    catch (ex) { console.error('Error during Schema validation', ex) }
  }

  private async selfTest() :Promise<boolean> {
    console.log('Running storage test...')
    if ( (await this.selfTestStore.getAll(null)).length!==0 ) return false
    const d1 = new DummyObj({ id: 'one', foo: 'bar' })
    try { await this.selfTestStore.upd(d1, d1); return false } catch (_) { /*expected*/ }
    if ( await this.selfTestStore.add(d1) !== 'one') return false
    try { await this.selfTestStore.add(d1); return false } catch (_) { /*expected*/ }
    const all = await this.selfTestStore.getAll(null)
    if ( all.length!==1 || all[0]?.[0]!=='one' || all[0][1].id!=='one' || all[0][1].foo!=='bar' ) return false
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
    // file storage
    if ( (await this.fileTestStore.list()).length !== 0 ) return false
    const f1 = new File(['Hello, World!'], 'test.txt', { type: 'text/plain' })
    await this.fileTestStore.add('foo', f1)
    try { await this.fileTestStore.add('foo', f1); return false } catch (_) { /*expected*/ }
    const fl1 = await this.fileTestStore.list()
    if ( fl1.length!==1 || fl1[0]?.[0]!=='foo' || fl1[0][1]!=='test.txt' ) return false
    const f1b = await this.fileTestStore.get('foo')
    if ( f1b.name!=='test.txt' || await f1b.text() !== 'Hello, World!' ) return false
    await this.fileTestStore.del('foo')
    try { await this.fileTestStore.get('foo'); return false } catch (_) { /*expected*/ }
    try { await this.fileTestStore.del('foo'); return false } catch (_) { /*expected*/ }
    if ( (await this.fileTestStore.list()).length !== 0 ) return false
    console.log('... storage test passed!')
    return true
  }

}
