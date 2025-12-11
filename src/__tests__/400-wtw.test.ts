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

test('wtw-ctrl', async ({ page }) => {
  await initPageTest(page)
  await page.evaluate(async () => {
    await window.FuchsTest.ctx.storage.samplingLogs.add({
      id: 'test', name: 'TestLog', startTime: 123, locations: [{
        name: 'TestLoc', actualCoords: { wgs84lat: 52.5, wgs84lon: 13.4 }, startTime: 123,
        samples: [
          { type: 'surface-water', subjectiveQuality: 'good', measurements: [] },
          { type: 'probe', subjectiveQuality: 'good', measurements: [] },
        ] }] })
    window.FuchsTest.ctx.stack.signalImport()
  })
  await expect(page.getByTestId('accSampLog')).toBeVisible()
  await page.getByText('TestLog').dblclick()
  await page.getByText('TestLoc').dblclick()
  await page.getByText('Read out probe data').dblclick()
  await expect(page.getByRole('button', { name: /Connect|Not available/ })).toBeVisible()
  //TODO: Extend this test a bit more (e.g. when it's implemented, check that the probe tools auto-expand here)
})

test('WtwReceiver', async ({ page }) => {
  await page.goto('/')
  /* If we were to use `new WtwReceiver()` here, that would create the object in the test runner's context
   * instead of the browser's execution context - and it's only instrumented for coverage in the latter.
   * We can only pass serializable objects or handles between the two, plus, in the browser's context,
   * things have been compiled and namespaced, which is why we need `window.FuchsTest` to access the class.
   * See also https://playwright.dev/docs/evaluating */
  const hnd = await page.evaluateHandle(() => new window.FuchsTest.WtwReceiver(123))
  const rxa = (val :string) => hnd.evaluate((rx,v) => rx.add(v), val)
  const rec =
    '17.08.2024 16:00:30\nMulti 3630 IDS\nSer. no. 12345678\nTetraCon 925\nSer. no. 23456789\nCond 0.0 µS/cm 22.6 °C, AR, S: +++\n'
    +'C = 0.458 1/cm, Tref25, nLF\nSenTix 940\nSer. no. B012345678\npH 7.040 22.5 °C, AR, S: ++\nFDO 925\nSer. no. 34567890\n'
    +'SC-FDO 45678901\nOx 8.51 mg/l 22.9 °C AR, S: +++'
  const exp = { raw: rec,
    meas: [
      { time: 123, type: { name: 'Cond', unit: 'µS/cm' }, value: '0.0' },
      { time: 123, type: { name: 'Temp(Cond)', unit: '°C' }, value: '22.6' },
      { time: 123, type: { name: 'pH', unit: 'pH' }, value: '7.040' },
      { time: 123, type: { name: 'Temp(pH)', unit: '°C' }, value: '22.5' },
      { time: 123, type: { name: 'Ox', unit: 'mg/l' }, value: '8.51' },
      { time: 123, type: { name: 'Temp(Ox)', unit: '°C' }, value: '22.9' },
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
  await hnd.evaluate(rx => rx.clear())
  await hnd.dispose()
})