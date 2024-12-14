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

/** Hacky workaround for the fact that Samsung mobile keyboards for
 * `input type="number"` or `input type="text" inputmode="decimal"`
 * don't show a minus sign; seems to be a known issue for many years.
 *
 * The better solution is for affected users to install a different keyboard.
 */
export function minusSignHack(el :HTMLInputElement) {
  let prevWasDot = false
  el.addEventListener('input', event => {
    if (!(event instanceof InputEvent)) return
    if (event.data==='.' && prevWasDot) {
      const ss = el.selectionStart
      if (ss && ss>1 && el.value.substring(ss-2, ss)==='..') {
        el.value = el.value.substring(0, ss-2) + '-' + el.value.substring(ss)
        el.setSelectionRange(ss-1, ss-1)
      }
      prevWasDot = false
    } else prevWasDot = event.data==='.'
  })
}
