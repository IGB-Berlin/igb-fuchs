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
import { StackAble } from './editors/stack'

/** A custom 'onchange' event, the purpose of which is that listeners can check if an `Editor` is dirty or not when its inputs change.
 *
 * Does not bubble, so it must be bubbled manually: custom `<input>`s embedded in `<div>`s (e.g. coordinate editor, datetime editor)
 * should dispatch this event on their parent `<div>` when they `change`, and `Editor.makeRow()` takes care of bubbling those events
 * to the `Editor`'s `.el`, where listeners can register to listen for any changes in the `Editor`, e.g. like `EditorStack` does.
 */
export class CustomChangeEvent extends CustomEvent<never> {
  static readonly NAME = 'custom.change'
  constructor() {
    super(CustomChangeEvent.NAME, { bubbles: false, cancelable: false })
  }
}

/** Currently only used in very limited cases where one UI element needs to signal an alert to another. */
export class CustomAlertEvent extends CustomEvent<never> {
  static readonly NAME = 'custom.alert'
  constructor() {
    super(CustomAlertEvent.NAME, { bubbles: false, cancelable: false })
  }
}

interface StoreEventDetails {
  action :'add'|'upd'|'del'
  id :string|null
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

/**
 * Meanings of `action`:
 * - `opened` - The Editor was freshly created, added to the stack, and shown.
 * - `shown` - The Editor was revealed because the Editor on top of it on the stack was closed.
 * - `hidden` - The Editor was hidden because a new Editor is going on top of it on the stack.
 * - `closed` - The Editor was removed from the stack and closed (and may potentially have been removed from DOM already by the time the event is processed).
 */
type StackEventDetails = {
  action :'opened'|'closed'
}|{
  action :'shown'|'hidden'
  /** NOTE that this Editor may not have been added to stack yet or already been removed and closed. */
  other :StackAble
}
/** A custom event for `EditorStack` that it fires on its `Editor`s.
 *
 * Does not bubble, so it must be bubbled manually.
 *
 * Note that the Stack also uses the callback methods `shown` and `close` on the Editors.
 * I've chosen to keep those for now - especially `close` should be synchronous (more specifically, awaited).
 * See GH issue #38: `shown` is a candidate that could be replaced by an event listener...
 */
export class CustomStackEvent extends CustomEvent<StackEventDetails> {
  static readonly NAME = 'custom.stack'
  constructor(detail :StackEventDetails) {
    super(CustomStackEvent.NAME, { detail: detail, bubbles: false, cancelable: false })
  }
}
