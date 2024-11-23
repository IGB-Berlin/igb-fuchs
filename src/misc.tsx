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
import * as bootstrap from 'bootstrap'
import { jsx } from './jsx-dom'
import { i18n } from './i18n'

export function noStorageAlert() {
  const dialog = <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static"
    data-bs-keyboard="false" tabindex="-1" aria-labelledby="noStorageAlert" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header text-bg-danger">
          <h1 class="modal-title fs-5" id="noStorageAlert">
            <i className="bi-exclamation-triangle-fill me-2"/>
            {i18n.t('alert-no-storage-title')}</h1>
        </div>
        <div class="modal-body">
          {i18n.t('alert-no-storage-text')}
        </div>
      </div>
    </div>
  </div>
  const modal = new bootstrap.Modal(dialog)
  modal.show()
}
