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
import { Measurement } from './types/measurement'

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
  meas :Measurement[]
}

export class WtwReceiver {
  private buf :string = ''
  add(data :string) :WtwParseResults[] {
    this.buf += data
    const m = this.buf.match( /^(.+)(?:\r?\n|\r)[-_]{5,}(?:\r?\n|\r)/s )
    if (m) {
      //TODO NEXT
    }
    return []
  }
}
