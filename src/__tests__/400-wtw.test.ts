/** This file is part of IGB-FUCHS.
 *
 * WTW® is a registered trademark of Xylem Analytics Germany GmbH.
 * This project is not affiliated with, endorsed by, or sponsored by Xylem or its subsidiaries.
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
import { test, expect } from 'playwright-test-coverage'
import { ISamplingLog } from '../types/sampling'
import { initPageTest } from './test-utils'

test('WTW import', async ({ page }) => {
  await initPageTest(page, { reduceMotion: true })
  const sampLog :ISamplingLog = {
    id: 'test', name: 'TestLog', startTime: 1234567890, locations: [{
      name: 'TestLoc', actualCoords: { wgs84lat: 52.5, wgs84lon: 13.4 }, startTime: 1234567890,
      samples: [
        { type: 'surface-water', subjectiveQuality: 'good', measurements: [] },
        { type: 'probe', subjectiveQuality: 'good', measurements: [] },
      ] }] }
  const sid = await page.evaluate(async sl => {
    const sid = await window.FuchsTest.ctx.storage.samplingLogs.add(sl)
    window.FuchsTest.ctx.stack.signalImport()
    return sid
  }, sampLog)
  await expect(page.getByTestId('accSampLog')).toBeVisible()
  await page.getByText('TestLog').dblclick()
  await expect(page.getByRole('heading', { name: 'Sampling Log' })).toBeVisible()
  await page.getByText('TestLoc').dblclick()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.getByRole('listitem').filter({ hasText: /\bSurface water\b/ }).dblclick()
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByLabel('Sample Type')).toHaveValue('surface-water')
  await expect(page.getByRole('button', { name: /\bConnect\b/ })).not.toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.getByRole('listitem').filter({ hasText: /\bRead out probe data\b/ }).dblclick()
  await expect(page.getByLabel('Sample Type')).toHaveValue('probe')
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  if (await page.evaluate(() => 'serial' in navigator)) {
    await expect(page.getByRole('button', { name: /\bConnect\b/ })).toBeVisible()
    await expect(page.getByText(/\bWTW®:.+Disconnected\b/)).toBeVisible()
  }
  else {  // Web Serial API not supported
    await expect(page.getByRole('button', { name: /\bNot available\b/ })).toBeVisible()
    await expect(page.getByText(/\bWTW®:.+Not available\b/)).toBeVisible()
  }

  /* *** Now let's fake some serial imports *** */
  const fake = (val :string) => page.evaluate(v => window.FuchsTest.fakeSerialRx(v), val)
  const checkMeas = async (ms :[meas_value :string, type_name :string, type_value :string][]) => {
    await expect(async () => {  // retry a couple of times in case the async data update isn't done yet
      const sl = await page.evaluate(async i => await window.FuchsTest.ctx.storage.samplingLogs.get(i), sid)
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      expect( sl.name ).toStrictEqual('TestLog')
      expect( sl.locations.length ).toStrictEqual(1)
      expect( sl.locations[0]!.name ).toStrictEqual('TestLoc')
      expect( sl.locations[0]!.samples.length ).toStrictEqual(2)
      expect( sl.locations[0]!.samples[0]!.type ).toStrictEqual('surface-water')
      expect( sl.locations[0]!.samples[1]!.type ).toStrictEqual('probe')
      expect( sl.locations[0]!.samples[0]!.measurements.length ).toStrictEqual(0)
      expect( sl.locations[0]!.samples[1]!.measurements.length ).toStrictEqual( ms.length )
      ms.forEach((m,i) => {
        expect( sl.locations[0]!.samples[1]!.measurements[i]!.value ).toStrictEqual(m[0])
        expect( sl.locations[0]!.samples[1]!.measurements[i]!.type.name ).toStrictEqual(m[1])
        expect( sl.locations[0]!.samples[1]!.measurements[i]!.type.unit ).toStrictEqual(m[2])
      })
      /* eslint-enable @typescript-eslint/no-non-null-assertion */
    }).toPass({ timeout: 5000 })
  }
  const handleDialog = async (txt :string, btn :'Overwrite'|'Append'|'Cancel'|'Understood') => {
    await expect( page.getByRole('heading', { name: 'Importing Measurements' }) ).toBeVisible()
    await expect(page.getByLabel('Importing Measurements').locator('ol')).toHaveText(txt)
    await page.getByRole('button', { name: btn }).click()
    await expect(page.getByLabel('Importing Measurements')).toBeHidden()  // data won't be updated until dialog is closed
  }

  await checkMeas([])  // double-check that no measurements are recorded

  // Import a measurement, should import without confirmation
  await fake('\nCond 0.0 µS/cm 22.6 °C\n_____\n')
  await checkMeas([ ['0.0','Cond','µS/cm'], ['22.6','Temp(Cond)','°C'] ])

  // Import the same measurement plus a new one, and since the previous meas hasn't changed, no prompt
  await fake('\nCond 0.0 µS/cm 22.6 °C\npH 7.040 22.5 °C\n_____\n')
  await checkMeas([ ['0.0','Cond','µS/cm'], ['22.6','Temp(Cond)','°C'], ['7.040','pH','pH'], ['22.5','Temp(pH)','°C'] ])

  // Just an information dialog for this import about the duplicate measurement
  await fake('\nCond 11.1 µS/cm 11.1 °C\nCond 0.0 µS/cm 22.6 °C\n_____\n')
  await handleDialog('Cond µS/cm'+'Importing: Cond = 0.0 µS/cm'+'Duplicate, ignoring: Cond = 11.1 µS/cm'
    +'Temp(Cond) °C'+'Importing: Temp(Cond) = 22.6 °C'+'Duplicate, ignoring: Temp(Cond) = 11.1 °C', 'Understood')
  await checkMeas([ ['7.040','pH','pH'], ['22.5','Temp(pH)','°C'], ['0.0','Cond','µS/cm'], ['22.6','Temp(Cond)','°C'] ])

  // Import the same measurement twice, replacing a previous one, user says overwrite
  await fake('\npH 7.150 22.5 °C\npH 3.100 13.1 °C\npH 7.150 22.5 °C\n_____\n')
  await handleDialog('pH pH'+'Importing: pH = 7.150 pH'+'Duplicate, ignoring: pH = 3.100 pH'+'Existing: pH = 7.040 pH'
    +'Temp(pH) °C'+'Importing: Temp(pH) = 22.5 °C'+'Duplicate, ignoring: Temp(pH) = 13.1 °C', 'Overwrite')
  await checkMeas([ ['0.0','Cond','µS/cm'], ['22.6','Temp(Cond)','°C'], ['7.150','pH','pH'], ['22.5','Temp(pH)','°C'] ])

  // Import a measurement and user says append (but first a cancel)
  await fake('\nCond 123.4 µS/cm 12.3 °C\n_____\n')
  await handleDialog('Cond µS/cm'+'Importing: Cond = 123.4 µS/cm'+'Existing: Cond = 0.0 µS/cm'
    +'Temp(Cond) °C'+'Importing: Temp(Cond) = 12.3 °C'+'Existing: Temp(Cond) = 22.6 °C', 'Cancel')
  await checkMeas([ ['0.0','Cond','µS/cm'], ['22.6','Temp(Cond)','°C'], ['7.150','pH','pH'], ['22.5','Temp(pH)','°C'] ])
  await fake('\nCond 123.4 µS/cm 12.3 °C\n_____\n')
  await handleDialog('Cond µS/cm'+'Importing: Cond = 123.4 µS/cm'+'Existing: Cond = 0.0 µS/cm'
    +'Temp(Cond) °C'+'Importing: Temp(Cond) = 12.3 °C'+'Existing: Temp(Cond) = 22.6 °C', 'Append')
  await checkMeas([ ['0.0','Cond','µS/cm'], ['22.6','Temp(Cond)','°C'], ['7.150','pH','pH'], ['22.5','Temp(pH)','°C'],
    ['123.4','Cond','µS/cm'], ['12.3','Temp(Cond)','°C'] ])
  // Now clobber the duplicates with an overwrite
  await fake('\nCond 234.5 µS/cm 23.4 °C\n_____\n')
  await handleDialog('Cond µS/cm'+'Importing: Cond = 234.5 µS/cm'+'Existing: Cond = 0.0 µS/cm'+'Existing: Cond = 123.4 µS/cm'
    +'Temp(Cond) °C'+'Importing: Temp(Cond) = 23.4 °C'+'Existing: Temp(Cond) = 22.6 °C'+'Existing: Temp(Cond) = 12.3 °C', 'Overwrite')
  await checkMeas([ ['7.150','pH','pH'], ['22.5','Temp(pH)','°C'], ['234.5','Cond','µS/cm'], ['23.4','Temp(Cond)','°C'] ])

})

test('WtwReceiver', async ({ page }) => {
  await page.goto('/')
  /* If we were to use `new WtwReceiver()` here, that would create the object in the test runner's context
   * instead of the browser's execution context - and it's only instrumented for coverage in the latter.
   * We can only pass serializable objects or handles between the two, plus, in the browser's context,
   * things have been compiled and namespaced, which is why we need `window.FuchsTest` to access the class.
   * See also https://playwright.dev/docs/evaluating */
  const hnd = await page.evaluateHandle(() => new window.FuchsTest.WtwReceiver())
  const rxa = (val :string) => hnd.evaluate((rx,v) => rx.add(v, 1234567890), val)
  const rec =
    '17.08.2024 16:00:30\nMulti 3630 IDS\nSer. no. 12345678\nTetraCon 925\nSer. no. 23456789\nCond 0.0 µS/cm 22.6 °C, AR, S: +++\n'
    +'C = 0.458 1/cm, Tref25, nLF\nSenTix 940\nSer. no. B012345678\npH 7.040 22.5 °C, AR, S: ++\nFDO 925\nSer. no. 34567890\n'
    +'SC-FDO 45678901\nOx 8.51 mg/l 22.9 °C AR, S: +++'
  const exp = { raw: rec,
    meas: [
      { time: 1234567890, type: { name: 'Cond', unit: 'µS/cm' }, value: '0.0' },
      { time: 1234567890, type: { name: 'Temp(Cond)', unit: '°C' }, value: '22.6' },
      { time: 1234567890, type: { name: 'pH', unit: 'pH' }, value: '7.040' },
      { time: 1234567890, type: { name: 'Temp(pH)', unit: '°C' }, value: '22.5' },
      { time: 1234567890, type: { name: 'Ox', unit: 'mg/l' }, value: '8.51' },
      { time: 1234567890, type: { name: 'Temp(Ox)', unit: '°C' }, value: '22.9' },
    ]}
  // a real record, split up
  expect( await rxa('') ).toStrictEqual([])
  expect( await rxa('17.08.202') ).toStrictEqual([])
  expect( await rxa('4 16:00:30\r\nMulti 3630 IDS\r\nSer. no.  12345678\r\n\r\n') ).toStrictEqual([])
  expect( await rxa('\r\nTetraCon 925\r\nSer. no.  23456789\r\nCond 0.0 µS/cm 22.6 °C, AR, S:  +++\r') ).toStrictEqual([])
  expect( await rxa('\nC = 0.458 1/cm, Tref25, nLF\r\n\r\nSenTix 940\r\nSer. no.  B012345678\r\npH 7.0') ).toStrictEqual([])
  expect( await rxa('40  22.5 °C, AR, S: ++\r\n\r\nFDO 925\r\nSer. no.  34567890\r\nSC-FDO  45678901\r\nOx   8.51 mg/l   22.9 °') ).toStrictEqual([])
  expect( await rxa('C AR, S:  +++\r\n\r\n_____________________________\r\n\r\n17.08.2024 16:01:26\r\nMulti 3630 IDS\r\n') ).toStrictEqual([exp])
  // a record with no measurements (see prev line)
  expect( await rxa('\r\n_____________________________\r\n') ).toStrictEqual([{ raw: '17.08.2024 16:01:26\nMulti 3630 IDS', meas: [] }])
  // exactly one record
  expect( await rxa(rec+'\n_____________________________\n') ).toStrictEqual([exp])
  // exactly two records
  expect( await rxa(rec+'\n-----\n'+rec+'\n_____\n') ).toStrictEqual([exp, exp])
  // CRLF line ending split over two rx's
  expect( await rxa(rec.replaceAll('\n','\r\n')+'\r\n-----') ).toStrictEqual([])
  expect( await rxa('\r') ).toStrictEqual([exp])
  expect( await rxa('\n'+rec.replaceAll('\n','\r\n')+'\r\n-----\r\n') ).toStrictEqual([exp])
  // send the minimum required for parsing
  const min = 'Cond 0.0 µS/cm 22.6 °C\npH 7.040 22.5 °C\nOx 8.51 mg/l 22.9 °C'
  expect( await rxa(min+'\n-----\n' )).toStrictEqual([{ raw: min, meas: exp.meas }])
  // test clearing
  expect( await rxa('Cond 0.0 µS/cm 22.6 °C\n') ).toStrictEqual([])
  await hnd.evaluate(rx => rx.clear())
  // test a single record
  expect( await rxa('  Ox 8.33 mg/l 21.5 °C\r_____\r') ).toStrictEqual([ { raw: 'Ox 8.33 mg/l 21.5 °C', meas: [
    { time: 1234567890, type: { name: 'Ox', unit: 'mg/l' }, value: '8.33' },
    { time: 1234567890, type: { name: 'Temp(Ox)', unit: '°C' }, value: '21.5' },
  ] } ])
  // test the same record twice
  expect( await rxa('Ox 8.33 mg/l 21.5 °C\r\nOx 8.33 mg/l 21.5 °C\n_____\r') ).toStrictEqual([ {
    raw: 'Ox 8.33 mg/l 21.5 °C\nOx 8.33 mg/l 21.5 °C', meas: [
      { time: 1234567890, type: { name: 'Ox', unit: 'mg/l' }, value: '8.33' },
      { time: 1234567890, type: { name: 'Temp(Ox)', unit: '°C' }, value: '21.5' },
      { time: 1234567890, type: { name: 'Ox', unit: 'mg/l' }, value: '8.33' },
      { time: 1234567890, type: { name: 'Temp(Ox)', unit: '°C' }, value: '21.5' },
    ] } ])
  // test the same type with different values
  expect( await rxa('Ox 8.33 mg/l 21.5 °C\r\nOx 8.25 mg/l 20.2 °C\n_____\r') ).toStrictEqual([ {
    raw: 'Ox 8.33 mg/l 21.5 °C\nOx 8.25 mg/l 20.2 °C', meas: [
      { time: 1234567890, type: { name: 'Ox', unit: 'mg/l' }, value: '8.33' },
      { time: 1234567890, type: { name: 'Temp(Ox)', unit: '°C' }, value: '21.5' },
      { time: 1234567890, type: { name: 'Ox', unit: 'mg/l' }, value: '8.25' },
      { time: 1234567890, type: { name: 'Temp(Ox)', unit: '°C' }, value: '20.2' },
    ] } ])
  await hnd.dispose()
})

test('failing imports', async ({ page }) => {
  await initPageTest(page, { reduceMotion: true })
  await expect(page.getByTestId('accSampLog')).toBeVisible()
  await page.getByRole('button', { name: 'More' }).click()
  await page.getByRole('button', { name: 'New' }).click()
  // new sampling log
  await expect(page.getByRole('heading', { name: 'Sampling Log' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('Spree')
  await page.getByTestId('logStartTime').getByRole('button', { name: 'Time' }).click()
  await page.getByTestId('logStartTime').getByRole('button', { name: 'Use current time' }).click()
  await page.getByRole('checkbox', { name: 'Automatically set end time' }).check()
  await page.getByRole('button', { name: /Save\s*$/ }).click()
  await page.getByRole('button', { name: 'New' }).click()
  // new sampling location
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Name' }).fill('S1')
  await page.getByRole('textbox', { name: 'Latitude' }).fill('12')
  await page.getByRole('textbox', { name: 'Longitude' }).fill('34')
  await page.getByTestId('locStartTime').getByRole('button', { name: 'Time' }).click()
  await page.getByTestId('locStartTime').getByRole('button', { name: 'Use current time' }).click()
  await page.getByRole('checkbox', { name: 'Automatically set end time' }).check()
  await page.getByRole('button', { name: /Save\s*$/ }).click()
  await page.getByRole('button', { name: 'New' }).click()
  // new sample
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await page.getByLabel('Sample Type').selectOption('probe')
  await page.getByRole('radio', { name: 'Good' }).check()
  // import when unsaved sample is open
  await page.evaluate(v => window.FuchsTest.fakeSerialRx(v), '\nCond 123.4 µS/cm 12.3 °C\n_____\n')
  await expect(page.getByLabel('Error')).toHaveText(/.*Please first save this Sample\b.*/i)
  await page.getByRole('button', { name: 'Understood' }).click()
  // save and try again
  await page.getByRole('button', { name: /Save\s*$/ }).click()
  await page.evaluate(v => window.FuchsTest.fakeSerialRx(v), '\nCond 123.4 µS/cm 12.3 °C\n_____\n')
  await expect(page.getByRole('listitem').filter({ hasText: 'Cond µS/cm' }).getByRole('textbox')).toHaveValue('123.4')
  await expect(page.getByRole('listitem').filter({ hasText: 'Temp(Cond) °C' }).getByRole('textbox')).toHaveValue('12.3')
  // now open a measurement
  await page.getByText('µS/cm').dblclick()
  await expect(page.getByRole('heading', { name: 'Measurement' })).toBeVisible()
  await page.evaluate(v => window.FuchsTest.fakeSerialRx(v), '\nCond 123.5 µS/cm 12.4 °C\n_____\n')
  await expect(page.getByLabel('Error')).toHaveText(/.*\bimport of measurements is only possible on the "Sample" page\b.*/i)
  await page.getByRole('button', { name: 'Understood' }).click()
  // go back to the sample and make sure it hasn't changed
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'Cond µS/cm' }).getByRole('textbox')).toHaveValue('123.4')
  await expect(page.getByRole('listitem').filter({ hasText: 'Temp(Cond) °C' }).getByRole('textbox')).toHaveValue('12.3')
  // go back to the Sampling Location and try to import
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.evaluate(v => window.FuchsTest.fakeSerialRx(v), '\nCond 123.5 µS/cm 12.4 °C\n_____\n')
  // to reenable this test, remove the `test.fail`, the `.soft` and the `timeout`, and reenable clicking the "Understood" button
  test.fail(true, 'Currently, receiving data when not on a sample is ignored, I think it should cause a warning?')
  await expect.soft(page.getByLabel('Error')).toHaveText(/.*\bimport of measurements is only possible on the "Sample" page\b.*/i,
    { timeout: 2000 })
  //await page.getByRole('button', { name: 'Understood' }).click()
  // back to sampling log and main page
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Log' })).toBeVisible()
  await page.getByRole('button', { name: 'Save & Close' }).click()
  await expect(page.getByTestId('accSampLog')).toBeVisible()
})