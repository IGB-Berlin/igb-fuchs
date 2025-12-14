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
import { initPageTest } from './test-utils'
import { ISamplingLog } from '../types/sampling'

test('WTW import', async ({ page }) => {
  await initPageTest(page)
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
  await page.getByText('TestLoc').dblclick()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.getByRole('listitem').filter({ hasText: /\bSurface water\b/ }).dblclick()
  await expect(page.getByRole('heading', { name: 'Sample' })).toBeVisible()
  await expect(page.getByRole('button', { name: /\bConnect\b/ })).not.toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Sampling Location' })).toBeVisible()
  await page.getByRole('listitem').filter({ hasText: /\bRead out probe data\b/ }).dblclick()
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
  const get = () => page.evaluate(async i => await window.FuchsTest.ctx.storage.samplingLogs.get(i), sid)
  { /* eslint-disable @typescript-eslint/no-non-null-assertion */
    { // double-check that no measurements are recorded
      const g = await get()
      expect( g.name ).toStrictEqual('TestLog')
      expect( g.locations.length ).toStrictEqual(1)
      expect( g.locations[0]!.name ).toStrictEqual('TestLoc')
      expect( g.locations[0]!.samples.length ).toStrictEqual(2)
      expect( g.locations[0]!.samples[0]!.type ).toStrictEqual('surface-water')
      expect( g.locations[0]!.samples[0]!.measurements.length ).toStrictEqual(0)
      expect( g.locations[0]!.samples[1]!.type ).toStrictEqual('probe')
      expect( g.locations[0]!.samples[1]!.measurements.length ).toStrictEqual(0)
    }
    { // Import a measurement, should import without confirmation
      await fake('\nCond 0.0 µS/cm 22.6 °C\n_____\n')
      const g = await get()
      expect( g.locations[0]!.samples[0]!.measurements.length ).toStrictEqual(0)
      expect( g.locations[0]!.samples[1]!.measurements.length ).toStrictEqual(2)
      expect( g.locations[0]!.samples[1]!.measurements[0]!.value ).toStrictEqual('0.0')
      expect( g.locations[0]!.samples[1]!.measurements[0]!.type.name ).toStrictEqual('Cond')
      expect( g.locations[0]!.samples[1]!.measurements[0]!.type.unit ).toStrictEqual('µS/cm')
      expect( g.locations[0]!.samples[1]!.measurements[1]!.value ).toStrictEqual('22.6')
      expect( g.locations[0]!.samples[1]!.measurements[1]!.type.name ).toStrictEqual('Temp(Cond)')
      expect( g.locations[0]!.samples[1]!.measurements[1]!.type.unit ).toStrictEqual('°C')
    }
    { // Import the same measurement plus a new one, and since the previous meas hasn't changed, no prompt
      //TODO await fake('\nCond 0.0 µS/cm 22.6 °C\npH 7.040 22.5 °C\n_____\n')
    }
    { // Import the same measurement twice, replacing a previous one, user says overwrite
      //TODO await fake('\npH 7.150 22.5 °C\npH 7.150 22.5 °C\n_____\n')
    }
    { // Import a measurement and user says append
      //TODO await fake('\nCond 0.0 µS/cm 22.6 °C\n_____\n')
    }
    { //TODO: import same measurement that is only different in the min/max fields, should cause overwrite dialog
      // ...
    }
  } /* eslint-enable @typescript-eslint/no-non-null-assertion */
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