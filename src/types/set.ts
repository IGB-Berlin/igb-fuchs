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

type HasEquals = { equals(other :unknown) :boolean }

/** Compares two arrays of objects as sets (i.e. order doesn't matter!), returning `true` if they are the same;
 * the objects must provide an `equals` method. */
export function dataSetsEqual<T extends HasEquals>(a :T[], b :T[]) :boolean {
  const x :T[] = Array.from(a)
  const y :T[] = Array.from(b)
  if (x.length!==y.length) return false
  for (let i = x.length-1; i>=0; i--) {
    if (!y.length) return false
    for (let j = y.length-1; j>=0; j--) {
      if (x[i]?.equals(y[j])) {
        x.splice(i,1)
        y.splice(j,1)
        break
      }
    }
  }
  return x.length===0 && y.length===0
}
