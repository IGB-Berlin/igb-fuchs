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

/** A custom 'onchange' event, the purpose of which is that listeners can check if an `Editor` is dirty or not when its inputs change.
 *
 * Does not bubble, so it must be bubbled manually: custom `<input>`s embedded in `<div>`s (e.g. coordinate editor, datetime editor)
 * should dispatch this event on their parent `<div>` when they `change`, and `Editor.makeRow()` takes care of bubbling those events
 * to the `Editor`'s `.el`, where listeners can register to listen for any changes in the `Editor`, e.g. like `EditorStack` does.
 */
export class CustomChangeEvent extends CustomEvent<never> {
  static NAME = 'custom.change'
  constructor() {
    super(CustomChangeEvent.NAME, { bubbles: false, cancelable: false })
  }
}

interface StoreEventDetails {
  action :'add'|'upd'|'del'
  id :string
}
/** A custom event for reporting that an `AbstractStore` has been changed.
 *
 * Does not bubble, so it must be bubbled manually. Is only fired by and on `Editor`s and `ListEditor`s and is handled and bubbled by them.
 */
export class CustomStoreEvent extends CustomEvent<StoreEventDetails> {
  static readonly NAME = 'custom.store'
  constructor(detail :StoreEventDetails) {
    super(CustomStoreEvent.NAME, { detail: detail, bubbles: false, cancelable: false })
  }
}
