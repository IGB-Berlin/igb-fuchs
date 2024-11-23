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

export async function shareCsv(fn :string, data :ArrayBuffer) :Promise<boolean> {
  try {
    const sh = { files: [new File([data], fn, { type: 'text/csv', endings: 'native' })] }
    await navigator.share(sh)
    return true
  }
  catch(ex) {
    console.warn('Share failed', ex)
    return false
  }
}

export async function downloadCsv(fn :string, data :ArrayBuffer) {
  const blob = new File([data], fn, { type: 'text/csv', endings: 'native' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.setProperty('display','none')
  a.href = url
  a.download = fn
  document.documentElement.appendChild(a)
  a.click()
  URL.revokeObjectURL(url)
}
