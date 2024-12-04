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
import { jsx, jsxFragment, safeCastElement } from './jsx-dom'
import { GlobalContext } from './main'
import { infoDialog } from './dialogs'
import { shareFile } from './share'
import { assert } from './utils'
import { tr } from './i18n'

export function makeImportExport(ctx :GlobalContext) :HTMLElement {
  const btnExportAll = <button type="button" class="btn btn-outline-primary"><i class="bi-box-arrow-up-right"/> {tr('Export All Data')}</button>
  const inpImportFile = safeCastElement(HTMLInputElement,
    <input type="file" class="form-control" aria-label={tr('Import Data')} id="importDataInput" />)
  const el = <div class="p-3 d-flex flex-column">
    {btnExportAll}
    <div class="mt-1 mb-4">{tr('export-help')}</div>
    <div class="input-group">
      <label class="input-group-text btn btn-outline-primary" for="importDataInput"><i class="bi-box-arrow-in-down-right me-1"/> {tr('Import Data')}</label>
      {inpImportFile}
    </div>
    <div class="mt-1">{tr('import-help')}</div>
  </div>

  btnExportAll.addEventListener('click', async () =>
    shareFile( new File( [JSON.stringify( await ctx.storage.export(), null, 2 )], 'igb-field.json', { type: 'application/json' } ) ) )

  inpImportFile.addEventListener('change', async () => {
    const files = inpImportFile.files
    if (!files || files.length!==1) return
    const file = files[0]
    assert(file)
    const res = await ctx.storage.import(JSON.parse(await file.text()))
    const infos = res.info.length ? <><p>{tr('Information')}:</p>
      <ul>{res.info.map(i => <li>{i}</li>)}</ul></> : ''
    if (res.errors.length)
      await infoDialog('error', tr('Import Data'),
        <><p><strong class="text-danger">{tr('import-with-errors')}</strong></p>
          <ul> { res.errors.map(e => <li>{e}</li>) } </ul>
          {infos}</>)
    else await infoDialog('info', tr('Import Data'),
      <><p><strong class="text-success">{tr('import-success')}</strong></p>
        {infos}</>)
    inpImportFile.value = ''
  })

  return el
}
