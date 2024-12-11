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
import { areWgs84CoordsValid, EMPTY_COORDS, IWgs84Coordinates, WGS84_PRECISION } from './coords'
import { isValidAndSetTs, NO_TIMESTAMP, Timestamp } from './common'
import { unparse as papaUnparse } from 'papaparse'
import { MeasurementType } from './meas-type'
import { distanceBearing } from '../geo-func'
import { deduplicatedSet } from './set'
import { SamplingTrip } from './trip'
import { assert } from '../utils'

type CsvRow = { [key :string]: string }
type RowWithKey = [number, CsvRow]

const MAX_NOM_ACT_DIST_CSV_M = 50

export function tripToCsvFile(trip :SamplingTrip) :File {

  // Gather measurement types to generate column headers
  const allTypes :MeasurementType[] = deduplicatedSet( trip.locations.flatMap(loc => loc.samples.flatMap(samp => samp.measurements.map(meas => meas.type))) )
  const columns = ['Timestamp','Location','Latitude_WGS84','Longitude_WGS84','SampleType','SubjectiveQuality','Notes']
  // typeId normally has the units in square brackets as a suffix, but if it doesn't (unitless), name collisions are possible, so add "[]" in those rare cases
  const measCols = allTypes.map(t => columns.includes(t.typeId) ? t.typeId+'[]' : t.typeId)
  columns.splice(-2, 0, ...measCols)  // inject before 'SubjectiveQuality'

  /* ********** ********** Process the trip ********** ********** */
  //TODO: The following field lists will need updating when things get renamed
  // trip: id, tripId, name, description, startTime, endTime, lastModified, persons, weather, notes, locations[], template?
  const tripNotes :string[] = [
    `Trip: ${trip.name}` + (isValidAndSetTs(trip.startTime) ? ` [${new Date(trip.startTime).toISOString()}]` : ''),
    trip.notes.trim().length ? `Trip Notes: ${trip.notes.trim()}` : '',
    trip.persons.trim().length ? `Persons: ${trip.persons.trim()}` : '',
    trip.weather.trim().length ? `Weather: ${trip.weather.trim()}` : '',
  ]

  //TODO Later: Show error when there are no locations in an export
  const data :RowWithKey[] = trip.locations.flatMap((loc,li) => {
    /* ********** ********** Process the location ********** ********** */
    // location: name, description, nominalCoords, actualCoords, startTime, endTime, samples[], notes, photos[], template?
    // coords: wgs84lat, wgs84lon

    // Coordinates: Either the actual coordinates, the nominal coordinates, or (if available) the location template's nominal coordinates
    const nomCoords = areWgs84CoordsValid(loc.nomCoords) ? loc.nomCoords
      : loc.template?.nomCoords && areWgs84CoordsValid(loc.template.nomCoords) ? loc.template.nomCoords
        : EMPTY_COORDS
    const actCoords = areWgs84CoordsValid(loc.actCoords) ? loc.actCoords : EMPTY_COORDS
    const coords :IWgs84Coordinates = areWgs84CoordsValid(actCoords) ? actCoords : nomCoords

    const locNotes :string[] = [
      loc.notes.trim().length ? `Location Notes: ${loc.notes.trim()}` : '',
      // if the actual coordinates are off from the nominal coordinates by a bit, report the nominal coordinates too
      areWgs84CoordsValid(actCoords) && areWgs84CoordsValid(nomCoords)
        && distanceBearing(actCoords, nomCoords).distKm*1000 > MAX_NOM_ACT_DIST_CSV_M
        ? 'Nominal Sampling Location Coordinates (WGS84 Lat,Lon): '
          +`${nomCoords.wgs84lat.toFixed(WGS84_PRECISION)},${nomCoords.wgs84lon.toFixed(WGS84_PRECISION)}` : '',
    ]

    //TODO Later: Always emit one row per location even when there are no samples, so the notes get recorded
    return loc.samples.map((samp,si) => {
      /* ********** ********** Process the sample ********** ********** */
      // sample: type, quality, description, measurements[], notes, template?

      const rowNotes = [samp.notes.trim()]
        .concat( li||si ? [] : tripNotes )  // append trip notes on the very first row
        .concat( si ? [] : locNotes )  // append location notes on the first sample of the location
        .filter(s => s.length).join('; ')

      // Prepare the row
      const row :CsvRow = {  // REMEMBER to keep in sync with `columns` above!
        // Timestamp is set below
        Location: loc.name,
        Latitude_WGS84:  areWgs84CoordsValid(coords) ? coords.wgs84lat.toFixed(WGS84_PRECISION) : '',
        Longitude_WGS84: areWgs84CoordsValid(coords) ? coords.wgs84lon.toFixed(WGS84_PRECISION) : '',
        SampleType: samp.type,
        SubjectiveQuality: samp.subjectiveQuality,
        Notes: rowNotes,
      }

      /* ********** ********** Process the measurements ********** ********** */
      // measurement: type, time, value
      // type: name, unit, min, max, precision, description

      /* Gather measurements; sort newest measurement first b/c if there are multiple
       * measurements of the same type, only the newest one is exported (is documented in UI) */
      const ms = Array.from(samp.measurements)
      ms.sort((a,b) => b.time-a.time)

      let firstMeasTime = +Infinity
      allTypes.forEach((type,ti) => {
        const meas = ms.find(m => type.equals(m.type))
        const key = measCols[ti]
        assert(key)
        row[key] = meas?.value ?? ''
        if (meas && meas.time < firstMeasTime) firstMeasTime = meas.time
      })

      // Time: Time of first measurement, or time of location arrival
      const time :Timestamp = isValidAndSetTs(firstMeasTime) ? firstMeasTime
        : ( isValidAndSetTs(loc.startTime) ? loc.startTime : NO_TIMESTAMP )
      row['Timestamp'] = isValidAndSetTs(time) ? new Date(time).toISOString() : ''

      const kRow :RowWithKey = [isValidAndSetTs(time) ? time : NO_TIMESTAMP, row]
      return kRow  /* ***** Done with row ***** */
    })
  })

  // sort rows by key (timestamp)
  //TODO Later: This sort can cause the Trip and location notes to move to rows other than the first
  data.sort((a,b) => a[0]-b[0])

  // https://www.papaparse.com/docs#json-to-csv
  return new File([papaUnparse(data.map(r=>r[1]), { columns: columns, newline: '\r\n' } )],
    trip.tripId+'.csv', { type: 'text/csv', endings: 'transparent', lastModified: trip.lastModified })
}
