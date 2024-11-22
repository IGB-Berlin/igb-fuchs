// @ts-check
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
import { Namer } from '@parcel/plugin'
import path from 'path'

/**
 * A service worker's scope is determined by its URL. By default, Parcel places our `worker/service-worker.ts`
 * at `up_\worker\service-worker.js`, which limits its scope to that directory, which doesn't help us (and the
 * source file needs to be in its own directory because it requires its own `tsconfig.json`). We also can't
 * rely on the server to send a `Service-Worker-Allowed` header to broaden its scope, so therefore, this Parcel
 * Namer plugin places `service-worker.js` into the root directory of the output. Note it does not check for
 * name collisions because we know we've only got one file with that name in this project.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#examples
 * https://parceljs.org/plugin-system/namer/
 * https://parceljs.org/features/plugins/#relative-file-paths
 * */
export default new Namer({
  name({bundle, logger}) {
    const asset = bundle.getMainEntry()
    if (!asset) return null
    const fp = asset.filePath
    if ( path.basename(fp) == 'service-worker.ts' ) {
      logger.log({message: `handling ${fp}`})
      return 'service-worker.js'
    }
    // Allow the next namer to handle this bundle.
    return null
  }
})
