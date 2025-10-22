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

export async function shareFile(file :File) {
  if ('share' in navigator) {
    try { await navigator.share({ files: [file] }) }
    catch (ex) {
      console.warn('Share failed', ex)
      downloadFile(file)
    }
  }
  else {
    console.log('Don\'t have navigator.share, just downloading')
    downloadFile(file)
  }
}

export function downloadFile(file :File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.style.setProperty('display','none')
  a.href = url
  a.download = file.name
  document.documentElement.appendChild(a)
  a.click()
  URL.revokeObjectURL(url)
}
