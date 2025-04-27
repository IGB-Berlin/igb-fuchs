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
import { initPageTest, dl2file } from './play-utils'
import { test, expect } from '@playwright/test'

test.use({ timezoneId: 'UTC' })
test('different timezone', async ({ page }) => {
  await initPageTest(page)
  //await page.emulateMedia({ reducedMotion: 'reduce' })  // this seems to help in WebKit
  await page.clock.setFixedTime('2024-01-02T02:01')

  // Create a new Sampling Log
  await expect(page.getByTestId('accSampLog')).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveText(['No items'])
  await page.getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Log' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('Spree')
  await expect(page.getByTestId('logStartTime').getByRole('textbox')).toHaveValue('')
  await expect(page.getByTestId('logEndTime').getByRole('textbox')).toHaveValue('')

  // Set Log times
  await page.clock.setFixedTime('2024-01-02T03:02')  // log start time
  await page.getByTestId('logStartTime').getByRole('button').click()
  await expect(page.getByRole('button', { name: 'Use current time' })).toBeVisible()
  await page.getByRole('button', { name: 'Use current time' }).click()
  //TODO NEXT: In WebKit, the following and even typing the DT string into the text box doesn't work, but the "Use current time" button does??
  //await page.getByTestId('logEndTime').getByRole('textbox').fill('2024-01-02T06:05')
  //await page.getByTestId('logEndTime').getByRole('textbox')
  //  .evaluate((input :HTMLInputElement, value :string) => input.value = value, '2024-01-02T06:05')
  await page.clock.setFixedTime('2024-01-02T09:08')  // dummy for debugging
  return  //TODO: remove me
  await page.getByRole('button', { name: /Save\s*$/ }).click()

  // Sampling Log needs at least one Location for export
  await page.clock.setFixedTime('2024-01-02T05:04')  // location end time
  await page.getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('S1')
  await page.getByRole('textbox', { name: 'Latitude' }).fill('52.1')
  await page.getByRole('textbox', { name: 'Longitude' }).fill('13.1')

  // Set Location times
  await page.getByTestId('locStartTime').getByRole('textbox').fill('2024-01-02T04:03')
  await expect(page.getByRole('checkbox', { name: 'Automatically set end time' })).not.toBeChecked()
  await page.getByRole('checkbox', { name: 'Automatically set end time' }).check()

  // Finish sampling log
  return
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Log' })).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByTestId('accSampLog')).toBeVisible()

  // Export
  await page.clock.setFixedTime('2024-01-02T07:06')  // export time
  await page.getByTestId('accSampLog').getByRole('button', { name: 'Export' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'As CSV' }).click()
  const expFile = await dl2file(await downloadPromise)
  console.log(expFile.name)
  const csv = await expFile.text()
  console.log(csv)

})
