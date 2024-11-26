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
import { i18n } from '../i18n'
import { jsx } from '../jsx-dom'
import { ListEditable, JsonSerializable } from '../types/common'
import { DoneCallback, Editor } from './base'

type EditorClass<T extends JsonSerializable & ListEditable> = { new (initObj :T|null, doneCb :DoneCallback): Editor<T> }

export class ListEditor<T extends JsonSerializable & ListEditable> {
  readonly el :HTMLElement
  constructor(theList :Array<T>, _editorClass :EditorClass<T>) {
    const btnNew = <button class="btn btn-info"><i class="bi-plus-circle"/> {i18n.t('new')}</button>
    this.el = <div>
      <ul class="list-group mb-2">
        {theList.map(item => {
          const btnEdit = <button class="ms-2 btn btn-primary"><i
            class="bi-pencil-fill"/><span class="d-none d-sm-inline"> {i18n.t('edit')}</span></button>
          const btnDel = <button class="ms-2 btn btn-danger"><i
            class="bi-trash3-fill"/><span class="d-none d-sm-inline"> {i18n.t('delete')}</span></button>
          return <li class="list-group-item d-flex">
            <div class="me-auto">{item.listDisplay()}</div>
            {btnDel}
            {btnEdit}
          </li>
        })}
      </ul>
      {btnNew}
    </div>
  }
}
