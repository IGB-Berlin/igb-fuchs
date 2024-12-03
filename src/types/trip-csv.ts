/** IGB-Field
 *
 * Copyright © 2024 Hauke Dämpfling (haukex@zero-g.net)
 * at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
 * Berlin, Germany, <https://www.igb-berlin.de/>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { areWgs84CoordsValid, EMPTY_COORDS, IWgs84Coordinates, WGS84_PRECISION } from './coords'
import { isValidAndSetTs, NO_TIMESTAMP, Timestamp } from './common'
import { unparse as papaUnparse } from 'papaparse'
import { MeasurementType } from './meas-type'
import { deduplicatedSet } from './set'
import { SamplingTrip } from './trip'
import { assert } from '../utils'

type CsvRow = { [key :string]: string }

export function tripToCsvFile(trip :SamplingTrip) :File {

  // Gather measurement types to generate column headers
  const allTypes :MeasurementType[] = deduplicatedSet( trip.locations.flatMap(loc => loc.samples.flatMap(samp => samp.measurements.map(meas => meas.type))) )
  const measCols = allTypes.map(t => `${t.name}[${ t.unit.trim().length ? t.unit : '?' }]`)
  // collisions between these column names and measurements aren't possible as long as these names don't have "[]" in them:
  const columns = ['Timestamp','Location','Latitude_WGS84','Longitude_WGS84','SampleType'].concat(measCols).concat(['Notes'])
  console.debug(columns)

  /* ********** ********** Process the trip ********** ********** */
  // trip: id, tripId, name, description, startTime, endTime, lastModified, persons, weather, notes, locations[], template?
  const tripNotes :string[] = [
    `Trip: ${trip.name}` + (isValidAndSetTs(trip.startTime) ? ` [${new Date(trip.startTime).toISOString()}]` : ''),
    trip.notes.trim().length ? `Trip Notes: ${trip.notes.trim()}` : '',
    trip.persons.trim().length ? `Persons: ${trip.persons.trim()}` : '',
    trip.weather.trim().length ? `Weather: ${trip.weather.trim()}` : '',
  ]

  const data :CsvRow[] = trip.locations.flatMap((loc,li) => {
    /* ********** ********** Process the location ********** ********** */
    // location: name, description, nominalCoords, actualCoords, startTime, endTime, samples[], notes, photos[], template?
    // coords: wgs84lat, wgs84lon

    // Coordinates: Either the actual coordinates, the nominal coordinates, or (if available) the location template's nominal coordinates
    const coords :IWgs84Coordinates = areWgs84CoordsValid(loc.actCoords) ? loc.actCoords
      : areWgs84CoordsValid(loc.nomCoords) ? loc.nomCoords
        : loc.template?.nomCoords && areWgs84CoordsValid(loc.template.nomCoords) ? loc.template.nomCoords
          : EMPTY_COORDS

    const locNotes :string[] = [
      loc.notes.trim().length ? `Location Notes: ${loc.notes.trim()}` : '',
      //TODO Later: Report nominal coords if different from actual coords
    ]

    return loc.samples.map((samp,si) => {
      /* ********** ********** Process the sample ********** ********** */
      // sample: type, measurements[], notes, template?

      const rowNotes = [samp.notes.trim()]
        .concat( li ? [] : tripNotes )  // append trip notes on the very first row
        .concat( si ? [] : locNotes )  // append location notes on the first sample of the location
        .filter(s => s.length).join('; ')

      // Time: Time of first measurement, or time of location arrival
      const time :Timestamp = samp.measurements.find(m => isValidAndSetTs(m.time))?.time
        ?? isValidAndSetTs(loc.startTime) ? loc.startTime : NO_TIMESTAMP

      const row :CsvRow = {  // REMEMBER to keep in sync with `columns` above!
        Timestamp: isValidAndSetTs(time) ? new Date(time).toISOString() : '',
        Location: loc.name,
        Latitude_WGS84:  areWgs84CoordsValid(coords) ? coords.wgs84lat.toFixed(WGS84_PRECISION) : '',
        Longitude_WGS84: areWgs84CoordsValid(coords) ? coords.wgs84lon.toFixed(WGS84_PRECISION) : '',
        SampleType: samp.type,
        Notes: rowNotes,
      }

      /* ********** ********** Process the measurements ********** ********** */
      // measurement: type, time, value.formattedValue()
      // type: name, unit, min, max, precision, description
      /* TODO: Currently, if a sample has multiple measurements of the same type, only the newest one is exported.
       * I need to handle this possibility via at *least* a warning, maybe even a validation error. */
      const ms = Array.from(samp.measurements)
      ms.sort((a,b) => b.time-a.time)
      allTypes.forEach((type,ti) => {
        const meas = ms.find(m => type.equals(m.type))
        const key = measCols[ti]
        assert(key)
        row[key] = meas!==undefined && Number.isFinite(meas.value) ? meas.formattedValue() : ''
      })

      return row  /* ***** Done with row ***** */
    })
  })

  // https://www.papaparse.com/docs#json-to-csv
  return new File([papaUnparse(data, { columns: columns, newline: '\r\n' } )],
    trip.tripId+'.csv', { type: 'text/csv', endings: 'transparent', lastModified: trip.lastModified })
}
