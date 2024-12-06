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

export class SimpleEventHub<T extends object> {
  /* TODO Later: Can SimpleEventHub be replaced by a 'custom.save' Event on ListEditor and Editor's .el?
   * (Editor and ListEditor just need to be passed their parent?) */
  private readonly listeners :EventHandler<T>[] = []
  //TODO Later: Audit that all added event handlers are also removed.
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
