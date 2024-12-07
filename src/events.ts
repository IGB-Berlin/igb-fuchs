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

export class CustomChangeEvent extends Event {
  static NAME = 'custom.change'
  constructor() {
    super(CustomChangeEvent.NAME, { bubbles: false, cancelable :false })
  }
}

type EventHandler<T extends object> = (event :T) => void

/* TODO Later: Can SimpleEventHub be replaced by a 'custom.save' Event on ListEditor and Editor's .el?
 * (Editor and ListEditor just need to be passed their parent?)
 * If not, audit that all added event handlers are also removed.
 *
 * Redesign notes:
 * - Who fires events: Only AbstractStore (subclasses ArrayStore and IdbStore fields) has an event hub. So:
 *   - AbstractStore.add() is called by:
 *     - Editor.doSave() for new objects
 *     - ListEditorForTemp's "From Template" button (adds a new object to the ListEditor's store, doesn't open an editor)
 *     - ListEditorWithTemp's "From Template" and "New" ("planned" templates) buttons
 *       (add a new object to the ListEditor's store and then immediately open an editor)
 *   - AbstractStore.upd() is called by:
 *     - Editor.doSave()
 *     - MeasurementEditor's "Select Measurement Type" button (but that's just to fire an event to redraw the MeasurementEditor)
 *   - AbstractStore.del() is called by: only ListEditor's "Delete" button
 *   - AbstractStore.mod() is called by: only Editor subclasses when a child ListEditor's storage reports a change (see below)
 * - Listeners:
 *   - ListEditor does redrawList when its storage has changed (needs to know the id of the changed object so it can be selected)
 *   - ListEditorWithTemp redraws its list of "planned" templates when the ListEditor's storage has changed
 *   - ListEditor listens whether its parent editor's object has been saved or not (if it hasn't, don't enable any edit buttons)
 *   - When an Editor has a child that is a ListEditor, any changes on the ListEditor's storage (which is the array held by the
 *     Editor's object) cause the Editor's object to be updated in its storage via .mod()
 *     - This is supposed to propagate the event all the way upwards to the ListEditor on the home page, which then saves the root object
 *   - The MeasurementEditor editor uses an ArrayStore with a single element, the MeasurementType, to use the
 *     storage's events to listen for changes of the MeasurementType, using that to update its display.
 *
 * => Every ArrayStore is edited by a ListEditor, so the events could be moved to the ListEditor's el?
 *   - The only exception is the MeasurementEditor's MeasTypeEditor.
 */

export class SimpleEventHub<T extends object> {
  private readonly listeners :EventHandler<T>[] = []
  /** Add an event listener. */
  add(handler :EventHandler<T>) {
    this.listeners.push(handler)
  }
  /** Remove an event listener. */
  remove(handler :EventHandler<T>) {
    for(let i=this.listeners.length-1; i>=0; i--)
      if (this.listeners[i]===handler)
        this.listeners.splice(i, 1)
  }
  /** Fire an event to all listeners. Errors in listeners are logged but otherwise ignored. */
  fire(event :T) {
    this.listeners.forEach(l => {
      try { l(event) }
      catch (ex) { console.error('Error in SimpleEventHub listener', ex) }
    })
  }
  /** Remove all event listeners. */
  clear() {
    this.listeners.length = 0
  }
}
