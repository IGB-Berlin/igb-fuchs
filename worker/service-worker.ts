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

/* This is the Service Worker that allows the Progressive Web App to work in offline mode. */

// We need to trick TypeScript into realizing that `self` isn't a `Window` in this file.
declare let self: ServiceWorkerGlobalScope

const GIT_COMMIT = (c => {
  const first = c.indexOf(' ')
  const last = c.lastIndexOf(' ')
  return first<0 || last<0 || last<=first ? '?' : c.substring(first+1, last)
})('$Commit$')  // is updated by git filters

// `manifest` is a list of the static resources that belong to the webapp
// `version` is a hash calculated by parcel for the static resources
import {manifest, version} from '@parcel/service-worker'

/* The name of the cache, dependent on the current version, so that when the version changes,
 * the previous cache is discarded and resources are fetched again. */
const APP_CACHE_NAME = `IGB-FUCHS-${version}-${GIT_COMMIT}`

// handler for the Service Worker "install" event (typically used for preloading)
async function install() {
  // add the files for this app to the (versioned) cache
  await (await caches.open(APP_CACHE_NAME)).addAll(manifest)
  console.debug('SW install: Added static resources to cache', APP_CACHE_NAME, manifest)
}
self.addEventListener('install', e => e.waitUntil(install()))

// handler for the Service Worker "activate" event (typically used for cache cleaning)
async function activate() {
  // determine which caches can be deleted
  const cachesToDelete = (await caches.keys()).filter(key => key !== APP_CACHE_NAME)
  if (cachesToDelete.length) {
    // and delete those caches
    await Promise.all(cachesToDelete.map(key => caches.delete(key)))
    console.debug('SW activate: Cleaned caches', cachesToDelete)
  }
  // activate this Service Worker on existing pages
  await self.clients.claim()
  console.debug('SW activated, cache',APP_CACHE_NAME)
}
self.addEventListener('activate', e => e.waitUntil(activate()))

// handler for the Service Worker "fetch" event (for intercepting all network requests)
self.addEventListener('fetch', event => {
  // don't touch URLs like "chrome-extension://"
  if (event.request.url.toLowerCase().startsWith('http')) {
    console.debug('SW fetch: Intercepting', event.request)
    event.respondWith(cacheFirst(event.request))
  }
  else
    console.debug('SW fetch: NOT Intercepting', event.request)
})

/* This function checks for the existence of a request URL in the specified cache, returning it
 * if it is found, otherwise it goes out to the network and stores the result in the cache. */
async function cacheFirst(request :Request) {
  try {
    const cache = await caches.open(APP_CACHE_NAME)
    const responseFromCache = await cache.match(request)
    if (responseFromCache) {
      console.debug(`cache HIT ${APP_CACHE_NAME} ${request.method} ${request.url}`)
      return responseFromCache
    } // else
    console.debug(`cache MISS ${APP_CACHE_NAME} ${request.method} ${request.url}`)
    const responseFromNetwork = await fetch(request)
    await cache.put(request, responseFromNetwork.clone())
    return responseFromNetwork
  } catch (error) {
    console.error(error)
    return Response.error()
  }
}
