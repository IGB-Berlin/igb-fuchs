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
import * as zip from '@zip.js/zip.js'
import { assert } from '../utils'
import Papa from 'papaparse'

test.setTimeout(60000)  // long test, timeout 60s instead of default 30s
test('full integration test', async ({ page }) => {
  await initPageTest(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })  // this seems to help in WebKit
  await page.clock.setFixedTime('2025-01-02T01:01Z')

  await page.getByRole('button', { name: 'Log Templates' }).click()
  // At this point, while the animation is running, there are two "New" buttons visible, so wait for animation to finish.
  await Promise.all([
    expect(page.getByTestId('accSampLog')).toBeHidden(),
    expect(page.getByTestId('accLogTemp')).toBeVisible() ])

  // New Sampling Procedure
  await expect(page.getByRole('listitem')).toHaveText(['No items'])
  await page.getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Procedure' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('Spree')
  await page.getByRole('textbox', { name: 'Checklist' }).fill('Take alpha probe\nTake beta probe')
  await page.getByRole('button', { name: /Save\s*$/ }).click()
  // New Sample Type: Surface water, "Alpha"
  await page.getByTestId('sampEdit').getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Sample Template' })).toBeVisible()
  await page.getByLabel('Sample Type').selectOption('surface-water')
  await page.getByRole('textbox', { name: 'Short Description' }).fill('Alpha')
  await page.getByRole('button', { name: /Save\s*$/ }).click()
  // New Measurement: Temperature
  await page.getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Measurement Type' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('Temperature')
  await page.getByRole('textbox', { name: 'Unit' }).fill('°C')
  await page.getByRole('spinbutton', { name: 'Precision' }).fill('1')
  await page.getByRole('textbox', { name: 'Minimum' }).fill('-4')
  await page.getByRole('textbox', { name: 'Maximum' }).fill('40')
  await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sample Template' })).toBeVisible()
  // New Measurement: O2
  await page.getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Measurement Type' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('O2')
  await page.getByRole('textbox', { name: 'Unit' }).fill('%')
  await page.getByRole('spinbutton', { name: 'Precision' }).fill('0')
  await page.getByRole('textbox', { name: 'Minimum' }).fill('0')
  await page.getByRole('textbox', { name: 'Maximum' }).fill('150')
  await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sample Template' })).toBeVisible()
  // Done with new Sample
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Procedure' })).toBeVisible()
  // New Sample Type: Flowing Surface water, "Beta"
  await page.getByTestId('sampEdit').getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Sample Template' })).toBeVisible()
  await page.getByLabel('Sample Type').selectOption('surface-water-flowing')
  await page.getByRole('textbox', { name: 'Short Description' }).fill('Beta')
  await page.getByRole('button', { name: /Save\s*$/ }).click()
  // Measurement from Template: Temperature
  await page.getByRole('button', { name: 'From Template' }).click()
  await expect(page.getByRole('heading', { name: 'New Measurement from Template' })).toBeVisible()
  await page.getByText('Temperature').click()
  await page.getByRole('button', { name: 'Select' }).click()
  await expect(page.getByRole('heading', { name: 'Measurement Type' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Temperature')
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sample Template' })).toBeVisible()
  // New Measurement: pH
  await page.getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Measurement Type' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('pH')
  await page.getByRole('textbox', { name: 'Unit' }).fill('pH')
  await page.getByRole('spinbutton', { name: 'Precision' }).fill('2')
  await page.getByRole('textbox', { name: 'Minimum' }).fill('0')
  await page.getByRole('textbox', { name: 'Maximum' }).fill('14')
  await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sample Template' })).toBeVisible()
  // Done with new Sample
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Procedure' })).toBeVisible()
  // New Sample Type: Sediment, no measurements
  await page.getByTestId('sampEdit').getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Sample Template' })).toBeVisible()
  await page.getByLabel('Sample Type').selectOption('sediment')
  await page.getByRole('textbox', { name: 'Instructions' }).fill('Collect 50g for lab')
  // Done with new Sample
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Procedure' })).toBeVisible()
  // Sampling Location S1
  await page.getByTestId('locEdit').getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location Template' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('S1')
  await page.getByRole('textbox', { name: 'Short Description' }).fill('Upper')
  await page.getByRole('textbox', { name: 'Latitude' }).fill('52.1')
  await page.getByRole('textbox', { name: 'Longitude' }).fill('13.1')
  await page.getByRole('textbox', { name: 'Task List' }).fill('Collect 1l water for lab\nClean sensor')
  await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Procedure' })).toBeVisible()
  // Sampling Location S2
  await page.getByTestId('locEdit').getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location Template' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('S2')
  await page.getByRole('textbox', { name: 'Short Description' }).fill('Middle')
  await page.getByRole('textbox', { name: 'Latitude' }).fill('52.2')
  await page.getByRole('textbox', { name: 'Longitude' }).fill('13.2')
  await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Procedure' })).toBeVisible()
  // Sampling Location S3
  await page.getByTestId('locEdit').getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location Template' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('S3')
  await page.getByRole('textbox', { name: 'Short Description' }).fill('Lower')
  await page.getByRole('textbox', { name: 'Latitude' }).fill('52.3')
  await page.getByRole('textbox', { name: 'Longitude' }).fill('13.3')
  await page.getByRole('button', { name: /Save\s*$/ }).click()
  // One sample with one measurement at S3
  await page.getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Sample Template' })).toBeVisible()
  await page.getByLabel('Sample Type').selectOption('water-precipitation')
  await page.getByRole('button', { name: /Save\s*$/ }).click()
  await page.getByRole('button', { name: 'New' }).click()
  await expect(page.getByRole('heading', { name: 'Measurement Type' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('Amount')
  await page.getByRole('textbox', { name: 'Unit' }).fill('ml')
  await page.getByRole('textbox', { name: 'Minimum' }).fill('0')
  await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Warnings' })).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveText(['No maximum value', 'No precision'])
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Warnings' })).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Sample Template' })).toBeVisible()
  // Done with Sample at S3
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location Template' })).toBeVisible()
  // Done with Sampling Location S3
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Procedure' })).toBeVisible()
  // Done with Sampling Procedure
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByTestId('accLogTemp')).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveText([/^Spree.*3 sampling locations/])

  // Switch to Sampling Logs accordion
  await page.getByRole('button', { name: 'Sampling Logs' }).click()
  // At this point, while the animation is running, there are two "New" buttons visible, so wait for animation to finish.
  await Promise.all([
    expect(page.getByTestId('accSampLog')).toBeVisible(),
    expect(page.getByTestId('accLogTemp')).toBeHidden() ])

  const sliderBar = page.getByTestId('sliderBar').filter({ visible: true })
  const sliderButton = page.getByTestId('sliderButton').filter({ visible: true })
  /** Utility function for operating the slider */
  const doSlider = async () => {
    await sliderButton.hover()
    await page.mouse.down()
    const box = await sliderBar.boundingBox()
    assert(box)
    await page.mouse.move(box.x + box.width, box.y, { steps: 3 })
    await page.mouse.up()
  }

  // Start new Sampling Log from Template
  await expect(page.getByRole('listitem')).toHaveText(['No items'])
  await page.getByRole('button', { name: 'From Template' }).click()
  await expect(page.getByRole('heading', { name: 'New Sampling Log from Procedure' })).toBeVisible()
  await page.clock.setFixedTime('2025-01-02T03:03Z')  // log start time
  await page.getByLabel('New Sampling Log from Procedure').getByText('Spree').dblclick()
  await expect(page.getByRole('heading', { name: /Sampling Log\s*$/ })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Spree')
  await page.clock.setFixedTime('2025-01-02T03:13Z')  // just to make sure it took the right time
  await expect(page.getByTestId('logStartTime').getByRole('textbox')).toHaveValue('2025-01-02T04:03')
  await expect(page.getByTestId('logEndTime').getByRole('textbox')).toHaveValue('')
  await expect(page.getByRole('checkbox', { name: 'Automatically set end time' })).toBeChecked()
  await page.getByRole('textbox', { name: 'Persons' }).fill('Me, You')
  await page.getByRole('textbox', { name: 'Weather' }).fill('Nice')
  await page.getByRole('checkbox', { name: 'Take Alpha probe' }).check()
  await page.getByRole('checkbox', { name: 'Take Beta probe' }).check()

  // Start first sampling location
  await page.clock.setFixedTime('2025-01-02T04:04Z')  // S1 start time
  await page.getByRole('listitem').filter({ hasText: 'S1 / Upper' }).getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('S1')
  await expect(page.getByRole('textbox', { name: 'Short Description' })).toHaveValue('Upper')
  await page.clock.setFixedTime('2025-01-02T04:14Z')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Latitude' })).toHaveValue('52.100000')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Longitude' })).toHaveValue('13.100000')
  await expect(page.getByTestId('actCoords').getByRole('textbox', { name: 'Latitude' })).toHaveValue('52.100000')
  await expect(page.getByTestId('actCoords').getByRole('textbox', { name: 'Longitude' })).toHaveValue('13.100000')
  await expect(page.getByTestId('locStartTime').getByRole('textbox')).toHaveValue('2025-01-02T05:04')
  await expect(page.getByTestId('locEndTime').getByRole('textbox')).toHaveValue('')
  await expect(page.getByRole('checkbox', { name: 'Automatically set end time' })).toBeChecked()

  // mark one task as completed
  await page.getByRole('listitem').filter({ hasText: 'Clean sensor' }).getByText('Completed').click()

  // Start S1 first planned sample
  await page.getByRole('listitem').filter({ hasText: 'Surface water (general) / Alpha' }).getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByLabel('Sample Type')).toHaveValue('surface-water')
  await expect(page.getByRole('textbox', { name: 'Short Description' })).toHaveValue('Alpha')
  await expect(page.getByRole('radio', { name: 'Good' })).toBeChecked()
  await page.getByRole('listitem').filter({ hasText: 'Temperature °C' }).getByRole('textbox').fill('10.1')
  await page.getByRole('listitem').filter({ hasText: 'O2 %' }).getByRole('textbox').fill('52')
  await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug
  await doSlider()

  // second planned sample (intentionally with warnings and editing afterwards)
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByLabel('Sample Type')).toHaveValue('surface-water-flowing')
  await expect(page.getByRole('textbox', { name: 'Short Description' })).toHaveValue('Beta')
  await page.getByRole('radio', { name: 'Questionable' }).check()
  const txtTemp = page.getByRole('listitem').filter({ hasText: 'Temperature °C' }).getByRole('textbox')
  await txtTemp.pressSequentially('..1,3')
  await expect(txtTemp).toHaveValue('-1.3')
  await page.getByRole('listitem').filter({ hasText: 'pH pH' }).getByRole('textbox').fill('6.9')
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Warnings' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: /Subjective quality.+please provide details/ })).toBeVisible()
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Warnings' })).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.getByRole('listitem').filter({ hasText: 'Flowing surface water / Beta' }).dblclick()
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByLabel('Sample Type')).toHaveValue('surface-water-flowing')
  await expect(page.getByRole('textbox', { name: 'Short Description' })).toHaveValue('Beta')
  await expect(page.getByRole('radio', { name: 'Questionable' })).toBeChecked()
  await expect(page.getByRole('listitem').filter({ hasText: 'Temperature °C' }).getByRole('textbox')).toHaveValue('-1.3')
  await expect(page.getByRole('listitem').filter({ hasText: 'pH pH' }).getByRole('textbox')).toHaveValue('6.9')
  await expect(page.getByRole('textbox', { name: 'Notes' })).toHaveValue('')
  await page.getByRole('textbox', { name: 'Notes' }).fill('Strange smell')
  await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug
  await page.getByRole('button', { name: 'Save & Close' }).click()

  // finish up sampling location (intentionally with warnings etc.)
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.clock.setFixedTime('2025-01-02T04:34Z')  // S1 end time
  await doSlider()
  await expect(page.getByRole('heading', { name: 'Warnings' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: /^One/ })).toHaveText([ 'One task not completed', 'One planned sample left' ])
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('S1')
  await page.getByRole('listitem').filter({ hasText: 'Sediment' }).getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Warnings' })).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByLabel('Sample Type')).toHaveValue('sediment')
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.getByRole('listitem').filter({ hasText: 'Collect 1l water for lab' }).getByText('Completed').click()
  await page.clock.setFixedTime('2025-01-02T05:05Z')  // S2 start time
  await doSlider()

  // Now at second sampling location
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('S2')
  await expect(page.getByRole('textbox', { name: 'Short Description' })).toHaveValue('Middle')
  await page.clock.setFixedTime('2025-01-02T05:15Z')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Latitude' })).toHaveValue('52.200000')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Longitude' })).toHaveValue('13.200000')
  await expect(page.getByTestId('actCoords').getByRole('textbox', { name: 'Latitude' })).toHaveValue('52.200000')
  await expect(page.getByTestId('actCoords').getByRole('textbox', { name: 'Longitude' })).toHaveValue('13.200000')
  await expect(page.getByTestId('locStartTime').getByRole('textbox')).toHaveValue('2025-01-02T06:05')
  await expect(page.getByTestId('locEndTime').getByRole('textbox')).toHaveValue('')
  await expect(page.getByRole('checkbox', { name: 'Automatically set end time' })).toBeChecked()

  const isFirefox = page.context().browser()?.browserType().name() === 'firefox'
  // get current coordinates (for fake coords see Playwright config file)
  if (!isFirefox) {  //TODO Later: Why is geolocation emulation not working on Firefox?
    await page.getByTestId('actCoords').getByRole('button', { name: 'Coordinates' }).click()
    await expect(page.getByRole('button', { name: 'Use current location' })).toBeVisible()
    await page.getByRole('button', { name: 'Use current location' }).click()
    await expect(page.getByTestId('actCoords').getByRole('textbox', { name: 'Latitude' })).toHaveValue('52.516312')
    await expect(page.getByTestId('actCoords').getByRole('textbox', { name: 'Longitude' })).toHaveValue('13.377657')
  }

  // Second sampling location first sample
  await page.getByRole('listitem').filter({ hasText: 'Surface water (general) / Alpha' }).getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByLabel('Sample Type')).toHaveValue('surface-water')
  await expect(page.getByRole('textbox', { name: 'Short Description' })).toHaveValue('Alpha')
  await expect(page.getByRole('radio', { name: 'Good' })).toBeChecked()
  await page.getByRole('listitem').filter({ hasText: 'Temperature °C' }).getByRole('textbox').fill('17.9')
  await page.getByRole('listitem').filter({ hasText: 'O2 %' }).getByRole('textbox').fill('123')
  await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug
  // (intentionally using save and close here instead of slider)
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()

  // Pretend the "Beta" probe failed and skip that
  await page.getByRole('textbox', { name: 'Notes' }).fill('Beta probe not working')

  await page.mouse.move(0,0)  /* Workaround for the test sometimes hanging here (at least on Chrome):
   * I think the mouse hovering over the Save & Close button and the resulting tooltip was causing the page to never be "stable"? */

  await page.getByRole('listitem').filter({ hasText: 'Sediment' }).getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByLabel('Sample Type')).toHaveValue('sediment')
  await page.getByRole('button', { name: /Save\s*$/ }).click()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.clock.setFixedTime('2025-01-02T05:35Z')  // S2 end time

  await doSlider()
  await expect(page.getByRole('heading', { name: 'Warnings' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: /^(One|Large)/ }))
    .toHaveText( isFirefox ? [ 'One planned sample left' ] :
      [ /^Large difference in the nominal and actual coordinates/, 'One planned sample left' ])
  await page.clock.setFixedTime('2025-01-02T06:06Z')  // S3 start time
  await doSlider()
  await expect(page.getByRole('heading', { name: 'Warnings' })).toBeHidden()

  // Now at third and last sampling location
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('S3')
  await expect(page.getByRole('textbox', { name: 'Short Description' })).toHaveValue('Lower')
  await page.clock.setFixedTime('2025-01-02T06:16Z')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Latitude' })).toHaveValue('52.300000')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Longitude' })).toHaveValue('13.300000')
  await page.getByTestId('actCoords').getByRole('textbox', { name: 'Latitude' }).fill('52.300100')
  await page.getByTestId('actCoords').getByRole('textbox', { name: 'Longitude' }).fill('13.300100')
  await expect(page.getByTestId('locStartTime').getByRole('textbox')).toHaveValue('2025-01-02T07:06')
  await expect(page.getByTestId('locEndTime').getByRole('textbox')).toHaveValue('')
  await expect(page.getByRole('checkbox', { name: 'Automatically set end time' })).toBeChecked()

  await page.getByRole('listitem').filter({ hasText: 'Precipitation' }).getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByLabel('Sample Type')).toHaveValue('water-precipitation')
  await expect(page.getByRole('textbox', { name: 'Short Description' })).toHaveValue('')
  await expect(page.getByRole('radio', { name: 'Good' })).toBeChecked()
  await (page.getByRole('listitem').filter({ hasText: 'Amount ml' }).getByRole('textbox')).fill('44')
  await page.getByRole('button', { name: 'Back' }).focus()  // Workaround for stack bug

  await page.getByRole('button', { name: 'Save & Close' }).click()
  await page.clock.setFixedTime('2025-01-02T06:36Z')  // S3 end time
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Log' })).toBeVisible()
  await page.clock.setFixedTime('2025-01-02T07:07Z')  // log end time & last modified time
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByTestId('accSampLog')).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveText([/^Spree/])
  await page.clock.setFixedTime('2025-01-03T08:08Z')  // export time

  const extractZip = async (zr :zip.ZipReader<unknown>) :Promise<[string, string][]> => {
    return Promise.all((await zr.getEntries()).map(async e => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      assert(e.getData)
      return [e.filename, await e.getData(new zip.TextWriter())]
    }))
  }

  // Export and check export
  await page.getByTestId('accSampLog').getByRole('button', { name: 'Export' }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'As ZIP' }).click()
  const zipFile = await dl2file(await downloadPromise)
  expect(zipFile.name).toStrictEqual('Spree_2025-01-02.2025-01-02-080700.fuchs-log.zip')
  const zipReader = new zip.ZipReader(new zip.BlobReader(zipFile))
  const files = await extractZip(zipReader)
  expect(files.length).toStrictEqual(2)
  files.sort((a,b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
  expect(files[0]?.[0]).toStrictEqual('Spree_2025-01-02.2025-01-02-080700.fuchs-log.csv')
  expect(files[1]?.[0]).toStrictEqual('Spree_2025-01-02.2025-01-02-080700.fuchs-log.json')
  const csv = Papa.parse(files[0]?.[1] ?? '', { delimiter: ',' })
  expect(csv.errors.length).toStrictEqual(0)
  //console.log(csv.data)  //TODO: check this
  //console.log(JSON.parse(files[1]?.[1]  ?? ''))  //TODO Later: check this

})
