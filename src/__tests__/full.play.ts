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
import { test, expect } from '@playwright/test'
import { initPageTest } from './play-utils'
import { assert } from '../utils'

test.setTimeout(60000)  // long test, timeout 60s instead of default 30s
test('full integration test', async ({ page }) => {
  await initPageTest(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })  // this seems to help in WebKit

  await page.getByRole('button', { name: 'Log Templates' }).click()
  // At this point, while the animation is running, there are two "New" buttons visible, so wait for animation to finish.
  await Promise.all([
    expect(page.getByTestId('accSampLog')).toBeHidden(),
    expect(page.getByTestId('accLogTemp')).toBeVisible() ])

  // New Sampling Procedure
  //TODO Later: For all items here, check that the list shows a "No items" text
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
  //TODO Later: for all warnings, check the warnings text here too
  await page.getByRole('button', { name: 'Save & Close' }).click()
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

  // Switch to Sampling Logs accordion
  await page.getByRole('button', { name: 'Sampling Logs' }).click()
  // At this point, while the animation is running, there are two "New" buttons visible, so wait for animation to finish.
  await Promise.all([
    expect(page.getByTestId('accSampLog')).toBeVisible(),
    expect(page.getByTestId('accLogTemp')).toBeHidden() ])

  // utility function for operating the slider
  const sliderBar = page.getByTestId('sliderBar').filter({ visible: true })
  const sliderButton = page.getByTestId('sliderButton').filter({ visible: true })
  const doSlider = async () => {
    await sliderButton.hover()
    await page.mouse.down()
    const box = await sliderBar.boundingBox()
    assert(box)
    await page.mouse.move(box.x + box.width, box.y, { steps: 3 })
    await page.mouse.up()
  }

  // Start new Sampling Log from Template
  await page.getByRole('button', { name: 'From Template' }).click()
  await expect(page.getByRole('heading', { name: 'New Sampling Log from Procedure' })).toBeVisible()
  await page.getByLabel('New Sampling Log from Procedure').getByText('Spree').dblclick()
  await expect(page.getByRole('heading', { name: /Sampling Log\s*$/ })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Spree')

  //const possibleValues = ['123', '456', '789']  //TODO: generate possible datetimes
  //expect( possibleValues ).toContain( await page.getByTestId('logStartTime').getByRole('textbox').inputValue() )
  await expect(page.getByTestId('logEndTime').getByRole('textbox')).toHaveValue('')
  await expect(page.getByRole('checkbox', { name: 'Automatically set end time' })).toBeChecked()
  await page.getByRole('textbox', { name: 'Persons' }).fill('Me, You')
  await page.getByRole('textbox', { name: 'Weather' }).fill('Nice')
  await page.getByRole('checkbox', { name: 'Take Alpha probe' }).check()
  await page.getByRole('checkbox', { name: 'Take Beta probe' }).check()

  // Start first sampling location
  await page.getByRole('listitem').filter({ hasText: 'S1 / Upper' }).getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('S1')
  await expect(page.getByRole('textbox', { name: 'Short Description' })).toHaveValue('Upper')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Latitude' })).toHaveValue('52.100000')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Longitude' })).toHaveValue('13.100000')
  await expect(page.getByTestId('actCoords').getByRole('textbox', { name: 'Latitude' })).toHaveValue('52.100000')
  await expect(page.getByTestId('actCoords').getByRole('textbox', { name: 'Longitude' })).toHaveValue('13.100000')
  //TODO: As above, check the start time
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
  await page.getByRole('button', { name: 'Save & Close' }).click()
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
  await doSlider()
  await expect(page.getByRole('heading', { name: 'Warnings' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('S1')
  await page.getByRole('listitem').filter({ hasText: 'Sediment' }).getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByLabel('Sample Type')).toHaveValue('sediment')
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.getByRole('listitem').filter({ hasText: 'Collect 1l water for lab' }).getByText('Completed').click()
  await doSlider()

  // Now at second sampling location
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('S2')
  await expect(page.getByRole('textbox', { name: 'Short Description' })).toHaveValue('Middle')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Latitude' })).toHaveValue('52.200000')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Longitude' })).toHaveValue('13.200000')
  await expect(page.getByTestId('actCoords').getByRole('textbox', { name: 'Latitude' })).toHaveValue('52.200000')
  await expect(page.getByTestId('actCoords').getByRole('textbox', { name: 'Longitude' })).toHaveValue('13.200000')
  //TODO: As above, check the start time
  await expect(page.getByTestId('locEndTime').getByRole('textbox')).toHaveValue('')
  await expect(page.getByRole('checkbox', { name: 'Automatically set end time' })).toBeChecked()

  // get current coordinates (for fake coords see Playwright config file)
  if (page.context().browser()?.browserType().name() !== 'firefox') {  //TODO: Why is this not working on Firefox?
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

  await page.mouse.move(0,0)  // workaround for the test sometimes hanging here (at least on Chrome):
  // I think the mouse hovering over the Save & Close button and the resulting tooltip was causing the page to never be "stable"?

  await page.getByRole('listitem').filter({ hasText: 'Sediment' }).getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByLabel('Sample Type')).toHaveValue('sediment')
  await page.getByRole('button', { name: /Save\s*$/ }).click()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()

  await doSlider()
  await expect(page.getByRole('heading', { name: 'Warnings' })).toBeVisible()
  await doSlider()

  // Now at third and last sampling location
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('S3')
  await expect(page.getByRole('textbox', { name: 'Short Description' })).toHaveValue('Lower')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Latitude' })).toHaveValue('52.300000')
  await expect(page.getByTestId('nomCoords').getByRole('textbox', { name: 'Longitude' })).toHaveValue('13.300000')
  await page.getByTestId('actCoords').getByRole('textbox', { name: 'Latitude' }).fill('52.300100')
  await page.getByTestId('actCoords').getByRole('textbox', { name: 'Longitude' }).fill('13.300100')
  //TODO: As above, check the start time
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
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Log' })).toBeVisible()
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByTestId('accSampLog')).toBeVisible()

  //TODO: Export and check export!

})
