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
import { Page, Download } from '@playwright/test'
import { expect } from 'playwright-test-coverage'

export async function initPageTest(page :Page, options :{ reduceMotion :boolean }) {
  // note this also serves as a significant part of the smoke test
  if (options.reduceMotion) await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page).toHaveTitle(/IGB-FUCHS/)
  await expect(page.getByTestId('betaWarningDialog')).toBeVisible()
  await page.getByRole('button', { name: 'I understand' }).click()
  await expect(page.getByTestId('betaWarningDialog')).toBeHidden()
}

/** Utility function to convert a Playwright Download to a File (=Blob) */
export async function dl2file(dl :Download) {
  const stream = await dl.createReadStream()
  const chunks: BlobPart[] = []
  for await (const chunk of stream) chunks.push(chunk as BlobPart)
  return new File(chunks, dl.suggestedFilename())
}
