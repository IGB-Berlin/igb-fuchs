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
import { Measurement, MeasurementType } from '../types/measurement'
import { expect, test } from '@jest/globals'
import { WtwReceiver } from '../wtw-parse'

test('WtwReceiver', () => {
  const rx = new WtwReceiver()
  const rec =
    '17.08.2024 16:00:30\nMulti 3630 IDS\nSer. no. 12345678\nTetraCon 925\nSer. no. 23456789\nCond 0.0 µS/cm 22.6 °C, AR, S: +++\n'
    +'C = 0.458 1/cm, Tref25, nLF\nSenTix 940\nSer. no. B012345678\npH 7.040 22.5 °C, AR, S: ++\nFDO 925\nSer. no. 34567890\n'
    +'SC-FDO 45678901\nOx 8.51 mg/l 22.9 °C AR, S: +++'
  const exp = { raw: rec,
    meas: [
      new Measurement({ time: 123, type: new MeasurementType({ name: 'Cond', unit: 'µS/cm' }), value: '0.0' }),
      new Measurement({ time: 123, type: new MeasurementType({ name: 'Temp(Cond)', unit: '°C' }), value: '22.6' }),
      new Measurement({ time: 123, type: new MeasurementType({ name: 'pH', unit: 'pH' }), value: '7.040' }),
      new Measurement({ time: 123, type: new MeasurementType({ name: 'Temp(pH)', unit: '°C' }), value: '22.5' }),
      new Measurement({ time: 123, type: new MeasurementType({ name: 'Ox', unit: 'mg/l' }), value: '8.51' }),
      new Measurement({ time: 123, type: new MeasurementType({ name: 'Temp(Ox)', unit: '°C' }), value: '22.9' }),
    ]}
  // a real record, split up
  expect( rx.add('') ).toStrictEqual([])
  expect( rx.add('17.08.202') ).toStrictEqual([])
  expect( rx.add('4 16:00:30\r\nMulti 3630 IDS\r\nSer. no.  12345678\r\n\r\n') ).toStrictEqual([])
  expect( rx.add('\r\nTetraCon 925\r\nSer. no.  23456789\r\nCond 0.0 µS/cm 22.6 °C, AR, S:  +++\r') ).toStrictEqual([])
  expect( rx.add('\nC = 0.458 1/cm, Tref25, nLF\r\n\r\nSenTix 940\r\nSer. no.  B012345678\r\npH 7.0') ).toStrictEqual([])
  expect( rx.add('40  22.5 °C, AR, S: ++\r\n\r\nFDO 925\r\nSer. no.  34567890\r\nSC-FDO  45678901\r\nOx   8.51 mg/l   22.9 °') ).toStrictEqual([])
  expect( rx.add('C AR, S:  +++\r\n\r\n_____________________________\r\n\r\n17.08.2024 16:01:26\r\nMulti 3630 IDS\r\n', 123) ).toStrictEqual([exp])
  // a record with no measurements (see prev line)
  expect( rx.add('\r\n_____________________________\r\n') ).toStrictEqual([{ raw: '17.08.2024 16:01:26\nMulti 3630 IDS', meas: [] }])
  // exactly one record
  expect( rx.add(rec+'\n_____________________________\n', 123) ).toStrictEqual([exp])
  // exactly two records
  expect( rx.add(rec+'\n-----\n'+rec+'\n_____\n', 123) ).toStrictEqual([exp, exp])
  // CRLF line ending split over two rx's
  expect( rx.add(rec.replaceAll('\n','\r\n')+'\r\n-----') ).toStrictEqual([])
  expect( rx.add('\r', 123) ).toStrictEqual([exp])
  expect( rx.add('\n'+rec.replaceAll('\n','\r\n')+'\r\n-----\r\n', 123) ).toStrictEqual([exp])
})