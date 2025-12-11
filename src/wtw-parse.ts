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
import { makeValidNumberPat, Timestamp, timestampNow } from './types/common'
import { IMeasurement } from './types/measurement'
import { assert } from './utils'

/* Example of a "printout" from a WTW device (CRLF, CP1252/Latin-1):
17.08.2024 16:00:30
Multi 3630 IDS
Ser. no.  12345678


TetraCon 925
Ser. no.  23456789
Cond 0.0 µS/cm 22.6 °C, AR, S:  +++
C = 0.458 1/cm, Tref25, nLF

SenTix 940
Ser. no.  B012345678
pH 7.040  22.5 °C, AR, S: ++

FDO 925
Ser. no.  34567890
SC-FDO  45678901
Ox   8.51 mg/l   22.9 °C AR, S:  +++

_____________________________
*/

export interface WtwParseResults {
  raw :string
  meas :IMeasurement[]
}

//TODO Later: Can any of the measurements ever be reported in scientific notation?
// $ perl -wM5.014 -MRegexp::Common=number -e 'say $RE{num}{real}'
// (?:(?i)(?:[-+]?)(?:(?=[.]?[0123456789])(?:[0123456789]*)(?:(?:[.])(?:[0123456789]{0,}))?)(?:(?:[E])(?:(?:[-+]?)(?:[0123456789]+))|))
// const NUM_RE = /[-+]?(?=[.]?[0-9])[0-9]*(?:[.][0-9]*)?(?:[Ee][-+]?[0-9]+)?\b/
const NUM_PAT = makeValidNumberPat()  // currently [-+]?(?:(?!0[0-9])[0-9]+(?:\.[0-9]+)?|\.[0-9]+)
const MEAS_RE = new RegExp(
  '^(?:'+
    //TODO Later: Can EC ever be reported in mS/cm?
    `(?i:Cond)\\s+(?<ec>${NUM_PAT})\\s*[µu]S/cm`+
    `|pH\\s+(?<ph>${NUM_PAT})`+
    `|(?i:Ox)\\s+(?<ox>${NUM_PAT})\\s*mg/l`+
  `)\\s+(?<t>${NUM_PAT})\\s*°C\\b`, 'mug')

export class WtwReceiver {
  private override_time_for_test :Timestamp|undefined
  constructor( override_time_for_test ?:Timestamp ) {
    this.override_time_for_test = override_time_for_test
  }
  private buf :string = ''
  clear() { this.buf='' }
  add(data :string) :WtwParseResults[] {
    const time = this.override_time_for_test ?? timestampNow()  // override is just for testing
    this.buf += data
    const blocks = this.buf.split(/^(?:-{5,}|_{5,})(?:\r?\n|\r)/m)
    this.buf = blocks.pop() ?? ''
    const res :WtwParseResults[] = []
    for (const block of blocks) {
      const raw = block.replaceAll('\r\n','\n').replaceAll('\r','\n').replaceAll(/\n{2,}/g,'\n').replaceAll(/[ \t]+/g,' ').trim()
      const meas :IMeasurement[] = []
      const matches = raw.matchAll(MEAS_RE)
      for (const m of matches) {
        assert(m.groups)
        if (m.groups['ec'] && m.groups['t'])
          meas.push({ type: { name: 'Cond', unit: 'µS/cm' }, time: time, value: m.groups['ec'] },
            { type: { name: 'Temp(Cond)', unit: '°C' }, time: time, value: m.groups['t'] } )
        else if (m.groups['ph'] && m.groups['t'])
          meas.push({ type: { name: 'pH', unit: 'pH' }, time: time, value: m.groups['ph'] },
            { type: { name: 'Temp(pH)', unit: '°C' }, time: time, value: m.groups['t'] } )
        else /* istanbul ignore else */ if (m.groups['ox'] && m.groups['t'])
          meas.push({ type: { name: 'Ox', unit: 'mg/l' }, time: time, value: m.groups['ox'] },
            { type: { name: 'Temp(Ox)', unit: '°C' }, time: time, value: m.groups['t'] } )
        else console.warn('unhandled match', m)  // shouldn't happen
      }
      res.push({ raw: raw, meas: meas })
    }
    return res
  }
}
