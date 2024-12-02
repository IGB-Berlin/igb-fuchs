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

type EventHandler<T extends object> = (event :T) => void

export class SimpleEventHub<T extends object> {
  protected readonly listeners :EventHandler<T>[] = []
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
