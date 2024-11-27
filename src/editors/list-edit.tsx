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
import { tr } from '../i18n'
import { jsx } from '../jsx-dom'
import { DataObjectBase } from '../types/common'
import { DoneCallback, Editor } from './base'

type EditorClass<T extends DataObjectBase> = { new (initObj :T|null, doneCb :DoneCallback): Editor<T> }

export class ListEditor<T extends DataObjectBase> {
  readonly el :HTMLElement
  constructor(theList :Array<T>, _editorClass :EditorClass<T>) {
    const btnNew = <button class="btn btn-info"><i class="bi-plus-circle"/> {tr('New')}</button>
    this.el = <div>
      <ul class="list-group mb-2">
        {theList.map(item => {
          const btnEdit = <button class="ms-2 btn btn-primary"><i
            class="bi-pencil-fill"/><span class="d-none d-sm-inline"> {tr('Edit')}</span></button>
          const btnDel = <button class="ms-2 btn btn-danger"><i
            class="bi-trash3-fill"/><span class="d-none d-sm-inline"> {tr('Delete')}</span></button>
          return <li class="list-group-item d-flex">
            <div class="me-auto">{item.summaryDisplay()}</div>
            {btnDel}
            {btnEdit}
          </li>
        })}
      </ul>
      {btnNew}
    </div>
  }
}
