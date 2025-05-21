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

const tz_tests = {
  'UTC': {
    'tzOff': '00:00',
    'logStartTime': '2024-01-02T02:02',
    'logEndTime': '2024-01-02T05:05',
    'locStartTime': '2024-01-02T03:03',
    'filename': 'Spree_2024-01-02.2024-01-02-060600.fuchs-log.csv',
    'csvLine': '2024-01-02 03:03:00 UTC,02.01.2024,03:03:00,S1,52.100000,13.100000,,,,,Spree; Start 2024-01-02 02:02:00 UTC,Foo,,',
  },
  'Europe/Berlin': {
    'tzOff': '+01:00',
    'logStartTime': '2024-01-02T03:02',
    'logEndTime': '2024-01-02T06:05',
    'locStartTime': '2024-01-02T04:03',
    'filename': 'Spree_2024-01-02.2024-01-02-070600.fuchs-log.csv',
    'csvLine': '2024-01-02 03:03:00 UTC,02.01.2024,04:03:00,S1,52.100000,13.100000,,,,,Spree; Start 2024-01-02 02:02:00 UTC,Foo,,',
  },
  'America/New_York': {
    'tzOff': '-05:00',
    'logStartTime': '2024-01-01T21:02',
    'logEndTime': '2024-01-02T00:05',
    'locStartTime': '2024-01-01T22:03',
    'filename': 'Spree_2024-01-01.2024-01-02-010600.fuchs-log.csv',
    'csvLine': '2024-01-02 03:03:00 UTC,01.01.2024,22:03:00,S1,52.100000,13.100000,,,,,Spree; Start 2024-01-02 02:02:00 UTC,Foo,,',
  },
} as const
Object.entries(tz_tests).forEach(([tz,v]) => {
  test.describe(`Timezone: ${tz}`, () => {
    test.use({ timezoneId: tz })
    test(`Timezone: ${tz}`, async ({ page }) => {
      await initPageTest(page)
      await page.emulateMedia({ reducedMotion: 'reduce' })  // this seems to help in WebKit
      await page.clock.setFixedTime('2024-01-02T01:01Z')

      // Create a new Sampling Log
      await expect(page.getByTestId('accSampLog')).toBeVisible()
      await expect(page.getByRole('listitem')).toHaveText(['No items'])
      await page.getByRole('button', { name: 'New' }).click()
      await expect(page.getByRole('heading', { name: 'Sampling Log' })).toBeVisible()
      await page.getByRole('textbox', { name: 'Name' }).fill('Spree')
      await expect(page.getByTestId('logStartTime').getByRole('textbox')).toHaveValue('')
      await expect(page.getByTestId('logEndTime').getByRole('textbox')).toHaveValue('')
      await expect(page.getByTestId('log-tz')).toHaveText(`${v['tzOff']} (${tz})`)

      // Set Log times
      await page.clock.setFixedTime('2024-01-02T02:02Z')  // log start time
      await page.getByTestId('logStartTime').getByRole('button').click()
      await expect(page.getByRole('button', { name: 'Use current time' })).toBeVisible()
      await page.getByRole('button', { name: 'Use current time' }).click()
      await expect(page.getByTestId('logStartTime').getByRole('textbox')).toHaveValue(v['logStartTime'])
      // Log End Time
      const isWebkit = page.context().browser()?.browserType().name() === 'webkit'
      await page.clock.setFixedTime('2024-01-02T05:05Z')
      if (isWebkit) { // WebKit apparently can't parse manually entered date/times...?
        await page.getByTestId('logEndTime').getByRole('button').click()
        await expect(page.getByRole('button', { name: 'Use current time' })).toBeVisible()
        await page.getByRole('button', { name: 'Use current time' }).click()
      }
      else await page.getByTestId('logEndTime').getByRole('textbox').fill(v['logEndTime'])
      await expect(page.getByTestId('logEndTime').getByRole('textbox')).toHaveValue(v['logEndTime'])
      await page.getByRole('button', { name: /Save\s*$/ }).click()

      // Sampling Log needs at least one Location for export
      await page.getByRole('button', { name: 'New' }).click()
      await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
      await page.getByRole('textbox', { name: 'Name' }).fill('S1')
      await page.getByRole('textbox', { name: 'Latitude' }).fill('52.1')
      await page.getByRole('textbox', { name: 'Longitude' }).fill('13.1')
      await expect(page.getByTestId('loc-tz')).toHaveText(`${v['tzOff']} (${tz})`)

      // Set Location times
      await page.clock.setFixedTime('2024-01-02T03:03Z')
      await page.getByTestId('locStartTime').getByRole('button').click()
      await expect(page.getByRole('button', { name: 'Use current time' })).toBeVisible()
      await page.getByRole('button', { name: 'Use current time' }).click()
      await expect(page.getByTestId('locStartTime').getByRole('textbox')).toHaveValue(v['locStartTime'])
      await page.clock.setFixedTime('2024-01-02T04:04Z')  // location end time
      await expect(page.getByRole('checkbox', { name: 'Automatically set end time' })).not.toBeChecked()
      await page.getByRole('checkbox', { name: 'Automatically set end time' }).check()

      // Finish sampling log
      await page.getByRole('button', { name: 'Save & Close' }).click()
      await expect(page.getByRole('heading', { name: 'Sampling Log' })).toBeVisible()
      await page.clock.setFixedTime('2024-01-02T06:06Z')  // last modified time
      await page.getByRole('textbox', { name: 'Notes' }).fill('Foo')
      await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug
      await page.getByRole('button', { name: 'Save & Close' }).click()
      await expect(page.getByTestId('accSampLog')).toBeVisible()

      // Export
      await page.clock.setFixedTime('2024-02-02T07:07Z')  // export time
      await page.getByTestId('accSampLog').getByRole('button', { name: 'Export' }).click()
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'As CSV' }).click()
      const expFile = await dl2file(await downloadPromise)

      // Export filename is based on last modified time, not export time
      expect(expFile.name).toStrictEqual(v['filename'])
      expect(await expFile.text()).toStrictEqual(
        `Timestamp[UTC],LocalDate[DMY],LocalTime[${tz}],Location,Latitude_WGS84,Longitude_WGS84,SampleType,SampleDesc`
        +',SubjectiveQuality,SampleNotes,SamplingLog,LogNotes,LocationNotes,LocationTasksCompleted\r\n'
        +v['csvLine'])
    })
  })
})
