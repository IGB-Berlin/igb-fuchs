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
import { SamplingLog, SamplingProcedure } from './types/sampling'
import { jsx, jsxFragment, safeCastElement } from './jsx-dom'
import { samplingLogToCsv } from './types/log2csv'
import { makeFilename } from './idb-store'
import { GlobalContext } from './main'
import { infoDialog } from './dialogs'
import * as zip from '@zip.js/zip.js'
import { shareFile } from './share'
import { i18n, tr } from './i18n'
import { assert } from './utils'

async function zipFiles(name :string, files :File[]) {
  const zw = new zip.ZipWriter(new zip.BlobWriter('application/zip'))
  await Promise.all( files.map(f => zw.add(f.name, new zip.BlobReader(f)) ) )
  return new File([await zw.close()], name, { type: 'application/zip' })
}

export class ImportExportTool {

  readonly ctx
  readonly el

  constructor(ctx :GlobalContext) {
    this.ctx = ctx

    const btnExportAll = <button type="button" class="btn btn-outline-primary"><i class="bi-box-arrow-up-right"/> {tr('Export All Data')}</button>
    btnExportAll.addEventListener('click', async () => shareFile( await ctx.storage.export() ) )

    const inpImportFile = safeCastElement(HTMLInputElement,
      <input type="file" class="form-control" aria-label={tr('Import Data')} id="importDataInput" accept=".json,application/json" />)

    this.el = <div class="p-3 d-flex flex-column">
      <div class="mt-1 mb-4">{tr('export-help')}</div>
      <div class="mt-1 input-group">
        <label class="input-group-text btn btn-outline-primary" for="importDataInput"><i class="bi-box-arrow-in-down-right me-1"/> {tr('Import Data')}</label>
        {inpImportFile}
      </div>
      <div class="mt-1 text-secondary mb-4">{tr('import-help')}</div>
      {btnExportAll}
      <div class="mt-1 text-secondary">{tr('export-all-help')}</div>
    </div>

    inpImportFile.addEventListener('change', async () => {
      const files = inpImportFile.files
      if (!files || files.length!==1) return
      const file = files[0]
      assert(file)
      const res = await ctx.storage.import(JSON.parse(await file.text()))
      const infos = <><p>{i18n.t('processed-objects', { count: res.summaries.length })}</p>
        <ul>{res.summaries.map(([inf,stat]) =>
          <li><div class="d-flex flex-wrap align-items-center column-gap-3"><em>{i18n.t('import-res-'+stat, {defaultValue:stat})}:</em>{inf}</div></li>
        )} </ul></>
      if (res.errors.length)
        await infoDialog('error', tr('Import Data'),
          <><p><strong class="text-danger">{tr('import-with-errors')}</strong></p>
            <ul> { res.errors.map(e => <li>{e}</li>) } </ul>
            {infos}</>)
      else await infoDialog('info', tr('Import Data'),
        <><p><strong class="text-success">{tr('import-success')}</strong></p>
          {infos}</>)
      inpImportFile.value = ''
      ctx.stack.signalImport()
    })

  }  // ImportExportTool constructor

  async exportAsJson(s :SamplingLog|SamplingProcedure) {
    await shareFile(this.ctx.storage.exportOne(s))
  }

  async exportAsZip(s :SamplingLog) {
    const f = await samplingLogToCsv(s)
    const j = this.ctx.storage.exportOne(s)
    await shareFile( await zipFiles( makeFilename(s,'zip'), f ? [f, j] : [j] ))
  }

  async exportAsCsv(s :SamplingLog) {
    const f = await samplingLogToCsv(s)
    if (f) await shareFile(f)
  }

}  // class ImportExportTool
