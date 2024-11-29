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
  constructor([watchParent, watchTarget]: [Node,Node]|[null,null] = [null,null]) {
    if (watchParent)
      // Watch for the target node being removed from somewhere below the parent; if that happens, clear the listener list.
      new MutationObserver((mutations, observer) => {
        if (mutations.some(m => Array.from(m.removedNodes).includes(watchTarget))) {
          console.debug('Node',watchTarget,'was removed from below',watchParent)
          this.clear()
          observer.disconnect()
        }
      }).observe(watchParent, { childList: true, subtree: true })
  }
  add(handler :EventHandler<T>) {
    this.listeners.push(handler)
  }
  remove(handler :EventHandler<T>) {
    for(let i=this.listeners.length-1; i>=0; i--)
      if (this.listeners[i]===handler)
        this.listeners.splice(i, 1)
  }
  fire(event :T) {
    this.listeners.forEach(l => {
      try { l(event) }
      catch (ex) { console.error('Error in SimpleEventHub listener', ex) }
    })
  }
  clear() {
    this.listeners.length = 0
  }
}