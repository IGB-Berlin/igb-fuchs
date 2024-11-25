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

/**
 * Initial thoughts from the brainstorming:
 * - Sampling Trip: project_id, name, description (saved template values?)
 *   - Individual values: date, sampling by, weather today, final notes
 *   - Sampling Point: id, name, description, project_id, coordinates (saved template values?)
 *     - Individual values: current date, current time, current coordinates
 * - Measurements: pH, conductivity, oxygen saturation, oxygen concentration, temperature, level, notes, photo(s)
 *   - pH: 1...pH....14 (2 Stellen nach Komma)
 *   - Cond. 1...Leitfähigkeit....10000 µS cm (ohne Komma)
 *   - Temp. -2°C....Temperatur...+35 °C (1 Stelle nach Komma)
 *   - O2% 0...Sauerstoffsättigung...150%
 *   - O2mg 0...Sauerstoffkonzentration...14,6 mg L
 *   - Level 0...Pegel...x cm (ohne Komma)
 */

/** Identifier stored as string - TODO Later: enforce format */
type Identifier = string
/** Timestamp stored as string - TODO Later: enforce ISO 8601 format */
type Timestamp = string

/** EPSG:4326 Coordinates ("WGS 84")
 *
 * Used by many GPS devices and the API of many online maps, like OSM and Google Maps.
 * Note KML requires "Lon,Lat" while many others (like Google Maps) require "Lat,Lon".
 * (Berlin's Lat,Lon is roughly 52.5,13.4)
 *
 * Precision: https://gis.stackexchange.com/a/8674 : eight decimal places ~1.1mm, Google Maps now gives six for ~11cm
 */
export interface IWGS84Coordinates {
  lat :number
  lon :number
}

export type MeasurementTypeId = 'temperature'|'water-level'|'conductivity'|'o2-percent'|'o2-absolute'|'ph'
export type Units = '°C'|'cm'|'µS/cm'|'%'|'mg/L'|'pH'

interface IMeasurementTypeBase<I extends Identifier, U extends string> {
  custom ?:boolean
  id :I
  units :U
}
/** Describes a type of measurement (not a specific measurement value). */
export interface IMeasurementType extends IMeasurementTypeBase<MeasurementTypeId, Units> {
  custom :never
  //TODO Later: Are MeasurementTypeId and Units always linked?
  id :MeasurementTypeId
  units :Units
  /** Optional: Maximum value for input validation. */
  min ?:number
  /** Option: Minimum value for input validation. */
  max ?:number
  /** Optional: Number of places after the decimal point (both for input validation and for display rounding). */
  fractionalDigits ?:number
}
/** Alternative to `MeasurementType` for use in case a unplanned measurement
 * needs to be taken, or a measurement type is not yet supported by this app. */
export interface ICustomMeasurement extends IMeasurementTypeBase<Identifier, string> {
  custom :true
  /** This ID may *not* be a value from `MeasurementTypeId` and *must* be unique. */
  id :Identifier
  /** Can be freeform, or existing units from `Units`. */
  units :string
  notes ?:string
}

/** Records an actual recorded measurement. */
export interface IMeasurement {
  /** *Must* reference an identifier from `SamplingTrip.measurementTypes`. */
  typeId :Identifier
  time :Timestamp
  value :number
}

//TODO: SampleType instead of WaterType (don't limit to water, could be sediment, fish, etc.)
export type WaterType = 'surface-stream'|'surface-pond'|'ground'|'precipitation'

/** Describes a sample taken as a template type - actual
 * samples are recorded as `Sample`s. */
export interface ISampleType {
  waterType :WaterType
  /** Optional: The typical measurements performed on this sample.
   * See also `SamplingTripTemplate.typicalMeasurements` if every location is the same. */
  typicalMeasurements ?:IMeasurementType[]
}
/** Records an actual sample taken. */
export interface ISample extends ISampleType {
  measurements :IMeasurement[]
  notes ?:string
  typicalMeasurements :never
}

/** Describes a sampling location as a template type - actual
 * measurement sites are recorded as `SamplingPoint`s. */
export interface ISamplingLocation {
  id :Identifier
  name :string
  alternateNames ?:string[]
  description ?:string
  normalCoordinates :IWGS84Coordinates
  /** Optional: The typical samples taken at this location,
   * each of which can have a set of typical measurements. */
  typicalSamples ?:ISampleType[]
}
/** Records and actual sampling point. */
export interface ISamplingPoint extends ISamplingLocation {
  startTime :Timestamp
  endTime :Timestamp
  actualCoordinates :IWGS84Coordinates
  samples :ISample[]
  notes ?:string
  /** Pictures taken at this location - TODO Later: how to represent as JSON? Filenames? */
  photos ?:string[]
  typicalSamples :never
}

/** Describes a sampling trip as a template type - actual
 * sampling trips are recorded as `SamplingTrip`s. */
export interface ISamplingTripTemplate {
  /** Name of this sampling trip template; must be unique. */
  name :string
  description ?:string
  /** Optional: The typical points on this sampling trip. */
  typicalPoints ?:ISamplingLocation[]
  /** Optional: The typical measurements performed at each location.
   * See also `SamplingLocation.typicalSamples` for per-site specification. */
  typicalMeasurements ?:IMeasurementType[]
}
/** Records an entire sampling trip. */
export interface ISamplingTrip extends ISamplingTripTemplate {
  id :Identifier
  startTime :Timestamp
  endTime :Timestamp
  /** Last modification time, in case of any later edits. */
  lastModified :Timestamp
  persons :string
  weather :string
  notes ?:string
  points :ISamplingPoint[]
  /** *Must* contain all the measurement types performed on this trip with unique
   * identifiers; i.e. every `Measurement.typeId` *must* be represented here.
   * TODO Later: Can also be used at the beginning of the trip to plan which measurements will be offered in UI by default? */
  measurementTypes :(IMeasurementType|ICustomMeasurement)[]
  typicalPoints :never
  typicalMeasurements :never
}


