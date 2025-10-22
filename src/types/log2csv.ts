/** This file is part of IGB-FUCHS.
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
import { areWgs84CoordsValid, EMPTY_COORDS, WGS84_PRECISION } from './coords'
import { toLocalDMY, toIsoUtc, toLocalTime } from '../editors/date-time'
import { isValidAndSetTs, NO_TIMESTAMP, Timestamp } from './common'
import { MeasurementType } from './measurement'
import { distanceBearing } from '../geo-func'
import { makeFilename } from '../idb-store'
import { SamplingLog } from './sampling'
import { deduplicatedSet } from './set'
import { infoDialog } from '../dialogs'
import { assert } from '../utils'
import { tr } from '../i18n'
import Papa from 'papaparse'

type CsvRow = { [key :string]: string }
function isCsvRow(o :unknown) :o is CsvRow {
  return !!o && typeof o === 'object' && Object.entries(o).every(([k,v]) => typeof k === 'string' && typeof v === 'string' ) }
function cloneCsvRow(row :CsvRow) :CsvRow {
  const clone :unknown = JSON.parse(JSON.stringify(row))
  assert(isCsvRow(clone))
  return clone
}

const MAX_NOM_ACT_DIST_CSV_M = 50

export async function samplingLogToCsv(log :SamplingLog) :Promise<File|null> {

  if (!log.locations.length) {
    await infoDialog('error', tr('No sampling locations'), tr('export-no-locations'))
    return null
  }
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Gather measurement types to generate column headers
  const allTypes :MeasurementType[] = deduplicatedSet( log.locations.flatMap(loc => loc.samples.flatMap(samp => samp.measurements.map(meas => meas.type))) )
  const columns = ['Timestamp[UTC]','LocalDate[DMY]','LocalTime['+tzName+']',
    'Location','Latitude_WGS84','Longitude_WGS84','SampleType','SampleDesc','SubjectiveQuality',
    'SampleNotes','SamplingLog','LogNotes','LocationNotes','LocationTasksCompleted']
  // typeId normally has the units in square brackets as a suffix, but if it doesn't (unitless), name collisions are possible, so add "[]" in those rare cases
  const measCols = allTypes.map(t => columns.includes(t.typeId) ? t.typeId+'[]' : t.typeId)
  columns.splice(-6, 0, ...measCols)  // inject before 'SubjectiveQuality'

  /* ********** ********** Process the log ********** ********** */
  // SamplingLog: id, logId, name, startTime, endTime, lastModified, persons, weather, notes, checkedTasks[], locations[], template?
  const sampLog = log.name + (isValidAndSetTs(log.startTime) ? `; Start ${toIsoUtc(log.startTime)} UTC` : '')
  const logNotes = [ log.notes.trim(),
    log.persons.trim().length ? `Persons: ${log.persons.trim()}` : '',
    log.weather.trim().length ? `Weather: ${log.weather.trim()}` : '',
  ].filter(s => s.length).join('; ')

  // NOTE we keep the sorting of the locations and samples defined by the user
  const data :CsvRow[] = log.locations.flatMap(loc => {
    /* ********** ********** Process the location ********** ********** */
    // SamplingLocation: name, shortDesc, actualCoords, startTime, endTime, notes, samples[], completedTasks[], photos[], template?
    // Wgs84Coordinates: wgs84lat, wgs84lon

    // Coordinates: Either the actual coordinates, or (if available) the location template's nominal coordinates
    const nomCoords = loc.template?.nomCoords && areWgs84CoordsValid(loc.template.nominalCoords) ? loc.template.nominalCoords : EMPTY_COORDS
    const actCoords = areWgs84CoordsValid(loc.actualCoords) ? loc.actualCoords : EMPTY_COORDS
    const coords = areWgs84CoordsValid(actCoords) ? actCoords : nomCoords

    const locNotes = [ loc.notes.trim(),
      // if the actual coordinates are off from the nominal coordinates by a bit, report the nominal coordinates too
      areWgs84CoordsValid(actCoords) && areWgs84CoordsValid(nomCoords)
        && distanceBearing(actCoords, nomCoords).distKm*1000 > MAX_NOM_ACT_DIST_CSV_M
        ? 'Nominal Sampling Location Coordinates (WGS84 Lat,Lon): '
          +`${nomCoords.wgs84lat.toFixed(WGS84_PRECISION)},${nomCoords.wgs84lon.toFixed(WGS84_PRECISION)}` : '',
    ].filter(s => s.length).join('; ')

    const baseRow :CsvRow = {
      Location: loc.name,
      Latitude_WGS84:  areWgs84CoordsValid(coords) ? coords.wgs84lat.toFixed(WGS84_PRECISION) : '',
      Longitude_WGS84: areWgs84CoordsValid(coords) ? coords.wgs84lon.toFixed(WGS84_PRECISION) : '',
      SamplingLog: sampLog,
      LogNotes: logNotes,
      LocationNotes: locNotes,
      LocationTasksCompleted: loc.completedTasks.join('; '),
    }

    // if there are no samples, emit a dummy line so the notes for this location get recorded
    if (!loc.samples.length) {
      if (isValidAndSetTs(loc.startTime)) {
        baseRow['Timestamp[UTC]'] = toIsoUtc(loc.startTime)+' UTC'
        baseRow['LocalDate[DMY]']  = toLocalDMY(loc.startTime)
        baseRow[`LocalTime[${tzName}]`]  = toLocalTime(loc.startTime)
      }
      return [baseRow]
    }

    return loc.samples.map(samp => {
      /* ********** ********** Process the sample ********** ********** */
      // Sample: type, shortDesc, subjectiveQuality, notes, measurements[], template?

      // Prepare the row (Timestamp, Date, and Time are set below)
      const row = cloneCsvRow(baseRow)
      row['SampleType'] = samp.type
      row['SampleDesc'] = samp.shortDesc.trim()
      row['SubjectiveQuality'] = samp.subjectiveQuality
      row['SampleNotes'] = samp.notes.trim()

      /* ********** ********** Process the measurements ********** ********** */
      // Measurement: type, time, value
      // MeasurementType: typeId, name, unit, min, max, precision, instructions

      /* Gather measurements; sort newest measurement first b/c if there are multiple
       * measurements of the same type, only the newest one is exported (is documented in UI) */
      const ms = Array.from(samp.measurements)
      ms.sort((a,b) => b.time-a.time)

      let firstMeasTime = Infinity
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
      if (isValidAndSetTs(time)) {
        row['Timestamp[UTC]'] = toIsoUtc(time)+' UTC'
        row['LocalDate[DMY]'] = toLocalDMY(time)
        row[`LocalTime[${tzName}]`] = toLocalTime(time)
      }

      return row  /* ***** Done with row ***** */
    })
  })

  // https://www.papaparse.com/docs#json-to-csv
  return new File([Papa.unparse(data, { columns: columns, newline: '\r\n' } )],
    makeFilename(log, 'csv'), { type: 'text/csv', endings: 'transparent', lastModified: log.lastModified })
}
