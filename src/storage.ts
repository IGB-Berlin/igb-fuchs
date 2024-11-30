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
import { HasId } from './types/list'

const PREFIX = 'IGB-Field'
export const MEAS_TYPES = 'measurement-types'
export const SAMP_TRIPS = 'sampling-trips'
export const TRIP_TEMPLATES = 'trip-templates'
export const LOC_TEMPLATES = 'location-templates'

function path2keys(path :string|string[]) {
  const paths = Array.isArray(path) ? [PREFIX].concat(path) : [PREFIX, path]
  paths.forEach(p => { if (p.includes('/')) throw new Error(`invalid path element "${p}"`) })
  return paths
}
const path2key = (path :string|string[]) => path2keys(path).join('/')
const key2paths = (key :string|null) => key ? key.split('/') : []

export function get(path :string|string[]) :string|null {
  return localStorage.getItem(path2key(path))
}

export function set(path :string|string[], value :string) :void {
  localStorage.setItem(path2key(path), value)
}

export function list(path :string|string[]) :string[][] {
  const sp = path2keys(path)
  const rv :string[][] = []
  for (let i=0; i<localStorage.length; i++) {
    const p = key2paths(localStorage.key(i))
    if ( p[0]===PREFIX && p.length===sp.length+1 ) {
      if ( sp.every((s,i) => s===p[i]) )
        rv.push(p.slice(1))
    }
  }
  return rv
}

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#testing_for_availability
export const CAN_STORAGE :boolean = (() => {
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
      const req = indexedDB.open(PREFIX, 0)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(new IndexedStorage(req.result))
      req.onupgradeneeded = () => {
        req.result.createObjectStore(MEAS_TYPES, { keyPath: 'id' })
        req.result.createObjectStore(TRIP_TEMPLATES, { keyPath: 'id' })
        req.result.createObjectStore(LOC_TEMPLATES, { keyPath: 'id' })
        req.result.createObjectStore(SAMP_TRIPS, { keyPath: 'id' })
      }
    })
  }
  protected readonly db :IDBDatabase
  protected constructor(db :IDBDatabase) {
    this.db = db
  }
  protected getAll(storeName :string) {
    return new Promise<unknown[]>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readonly')
      trans.onerror = () => reject(trans.error)
      const req = trans.objectStore(storeName).getAll()
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result)
    })
  }
  protected get(storeName :string, key :string) {
    return new Promise<unknown>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readonly')
      trans.onerror = () => reject(trans.error)
      // Prefer .openCursor() over .get() b/c the former tells us when there was no such key
      const req = trans.objectStore(storeName).openCursor(key)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        if (req.result) resolve(req.result.value)
        else reject(new Error(`Key ${key} not found`))
      }
    })
  }
  protected add(storeName :string, data :HasId) {
    return new Promise<void>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readwrite')
      trans.onerror = () => reject(trans.error)
      trans.oncomplete = () => resolve()
      // .add() already throws an error if the Id already exists
      const req = trans.objectStore(storeName).add(data)
      req.onerror = () => reject(req.error)
    })
  }
  protected set(storeName :string, data :HasId) {
    return new Promise<void>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readwrite')
      trans.onerror = () => reject(trans.error)
      trans.oncomplete = () => resolve()
      const store = trans.objectStore(storeName)
      const req1 = store.openCursor(data.id)
      req1.onerror = () => reject(req1.error)
      req1.onsuccess = () => {
        if (req1.result) {  // was found
          const req2 = req1.result.update(data)
          req2.onerror = () => reject(req2.error)
        }
        else reject(new Error(`Key ${data.id} not found`))
      }
    })
  }
  protected del(storeName :string, data :HasId) {
    return new Promise<void>((resolve, reject) => {
      const trans = this.db.transaction([storeName], 'readwrite')
      trans.onerror = () => reject(trans.error)
      trans.oncomplete = () => resolve()
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
}
