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

export function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) throw new Error(msg) }

/** Exactly the same as `assert`, but label paranoid checks as such (i.e. they could be removed someday) */
export function paranoia(condition: unknown, msg?: string): asserts condition {
  if (!condition) throw new Error(msg) }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Class<T> = new (...args :any[]) => T

export function makeTextAreaAutoHeight(el :HTMLTextAreaElement) {
  // someday: https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing
  const update = () => {
    el.style.setProperty('overflow-y', 'hidden')
    el.style.setProperty('height', '') // trick to allow shrinking
    el.style.setProperty('height', `${el.scrollHeight}px`)
  }
  el.addEventListener('input', update)
  setTimeout(update)
}
