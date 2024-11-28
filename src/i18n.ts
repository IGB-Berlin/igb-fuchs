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
import { I18n } from 'i18n-js'

const translations = {
  //     'English (en-US)': ['Deutsch (de-DE)'],
  // For long texts: 'key': ['Deutsch (de-DE)', 'English (en-US)'],
  'About': ['Über'],

  'Cancel': ['Abbrechen'],
  'Edit': ['Bearbeiten'],
  'Delete': ['Löschen'],
  'New': ['Neu'],
  'Save & Close': ['Speichern & Schließen'],
  'Save': ['Speichern'],
  'Discard': ['Verwerfen'],
  'Warnings': ['Warnungen'],
  'Error': ['Fehler'],
  'No items': ['Keine Einträge'],

  // editors
  'Required': ['Eingabe erforderlich'],
  'Recommended': ['Eingabe empfohlen'],
  'editor-warn-info': [
    'Bitte die Warnungen korrigieren, oder nochmals auf "Speichern" klicken, um trotzdem zu speichern.',
    'Please either correct these warnings, or click "Save" again to save despite the warnings.' ],
  'editor-err-info': [
    'Bitte den Fehler beheben, um Speichern zu ermöglichen.',
    'Please correct the error to allow saving.' ],
  'Name': ['Name'],
  'name-help': [
    'Namen müssen mit einem Buchstaben oder einer Zahl beginnen, dürfen nur ausgewählte Sonderzeichen enthalten (.,-_ und Klammern),'
    +' und dürfen nicht auf einem Leerzeichen enden. Namen werden nicht übersetzt, daher wird empfohlen englische Namen zu verwenden.',
    'Names must begin with a letter or number, may contain only selected special characters (.,-_ and parentheses), and may not end on a space.'
    +' Names are not translated, so English is recommended.' ],
  'Notes': ['Notizen'],
  'notes-help': [
    'Etwaige Notizen.',
    'Optional notes.' ],
  'Description': ['Beschreibung'],
  'desc-help': [
    'Etwaige Beschreibung.',
    'Optional description.' ],

  // editor: meas-type
  'meas-name-help': [
    'Beispiele: "Temperature", "ph", "Leitfähigkeit" bzw. "Conductivity", "O2 relative", usw.',
    'Examples: "Temperature", "pH", "Conductivity", "O2 relative", etc.' ],
  'Unit': ['Messeinheit'],
  'unit-help': [
    'Einheit des gemessenen Werts.',
    'The unit of the measurement value.' ],
  'Minimum': ['Minimalwert'],
  'min-help': [
    'Messwerte sollten diesen Wert nicht unterschreiten.',
    'Measurement values should not be below this value.' ],
  'Maximum': ['Maximalwert'],
  'max-help': [
    'Messwerte sollten diesen Wert nicht überschreiten.',
    'Measurement values should not be above this value.' ],
  'Precision': ['Nachkommastellen'],
  'precision-help': [
    'Die Anzahl der Nachkommastellen des Messwerts.',
    'The number of decimal places after the digit in the measurement value.' ],

  // dialogs
  'Unsaved Changes': ['Nicht gespeicherte Änderungen'],
  'unsaved-changes': [
    'Die Eingaben wurden noch nicht gespeichert.',
    'The changes were not yet saved.'],
  'Confirm Deletion': ['Löschen Bestätigen'],
  'confirm-delete': [
    'Diese Daten wirklich löschen?',
    'Really delete this data?' ],

  // other
  'Error: No Storage Available': ['Fehler: Kein Speicher verfügbar'],
  'alert-no-storage-text': [
    'Dein Browser hat keinen lokalen Speicher zur Verfügung gestellt. Diese App kann nicht im "privaten" modus'
    +' verwendet werden. Stelle außerdem sicher, dass du keine Browser-Plugins hast, die Inhalt sperren könnten'
    +' (z.B. Werbungs-Blocker); falls du solche Plugins hast, müssen sie für diese App deaktiviert werden.',
    'Your browser has not made any local storage available. This app cannot be used in "private browsing" mode,'
    +' and make sure you don\'t have any browser plugins enabled that may block content (ad blockers etc.).'
    +' If you do, you need to disable them for this app.' ],

  // types
  'Sampling Trip': ['Messfahrt'],
  'Sampling Trips': ['Messfahrten'],
  'Sampling Trip Template': ['Messfahrt-Vorlage'],
  'Sampling Location': ['Messpunkt'],
  'Sampling Locations': ['Messpunkte'],
  'Sampling Location Template': ['Messpunkt-Vorlage'],
  'Sample': ['Probe'],
  'Template Sample': ['Vorlage für Probe'],
  'Measurement': ['Messung'],
  'Measurement Type': ['Messtyp'],
  'Measurement Types': ['Messtypen'],
  'Coordinates': ['Koordinaten'],
  'sampling-locations': [
    { zero: 'keine Messpunkte', one: 'ein Messpunkt', other: '%{count} Messpunkte' },
    { zero: 'no sampling locations', one: 'one sampling location', other: '%{count} sampling locations' } ],
  'measurements': [
    { zero: 'keine Messungen', one: 'eine Messung', other: '%{count} Messungen' },
    { zero: 'no measurements', one: 'one measurement', other: '%{count} measurements' } ],
  // partially abbrev. for breadcrumbs
  'Templates': ['Vorlagen'],
  'Trips': ['Fahrten'],
  'Trip': ['Messfahrt'],
  'Locations': ['Messpunkte'],
  'Location': ['Messpunkt'],
  'Meas.': ['Messung'],
  'Meas. Type': ['Messtyp'],

  // types problems
  'No start time': ['Keine Anfangs-Zeit'],
  'No end time': ['Keine End-Zeit'],
  'No sampling locations': ['Keine Messpunkte'],
  'No samples': ['Keine Proben'],
  'No units': ['Keine Messeinheit'],
  'No minimum value': ['Kein Minimalwert'],
  'No maximum value': ['Kein Maximalwert'],
  'No precision': ['Keine Anzahl der Nachkommastellen'],
  'No timestamp': ['Kein Zeitstempel'],
  'No measurement value': ['Kein Messwert'],
  'No measurements': ['Keine Messungen'],
  'no-trip-loc': ['Keine Messpunkte in der Vorlage', 'No sampling locations in this template'],
  'Invalid name': ['Ungültiger Name'],
  'Invalid timestamp': ['Ungültiger Zeitstempel'],
  'Invalid unit': ['Ungültige Messeinheit'],
  'Invalid minimum value': ['Ungültiger Minimalwert'],
  'Invalid maximum value': ['Ungültiger Maximalwert'],
  'Invalid min/max value': ['Ungültiger Minimal-/Maximalwert'],
  'Invalid precision': ['Ungültige Anzahl der Nachkommastellen'],
  'Invalid sample type': ['Ungültiger Probentyp'],
  'invalid-latitude': [
    'Ungültiger Breitengrad, benötigt wird eine Zahl zwischen -90 und +90',
    'Invalid latitude, required is a number between -90 and +90' ],
  'invalid-longitude': [
    'Ungültiger Längengrad, benötigt wird eine Zahl zwischen -180 und +180',
    'Invalid longitude, required is a number between -180 and +180' ],
  'large-coord-diff': [
    'Großer Unterschied zwischen Soll- und Ist-Koordinaten',
    'Large difference in the nominal and actual coordinates' ],
  'meas-above-max': [
    'Der Messwert liegt über dem Maximalwert',
    'The measurement value is above the maximum' ],
  'meas-below-min': [
    'Der Messwert liegt unter dem Minimalwert',
    'The measurement value is below the minimum' ],

  // sample types (Remember to keep in sync with SampleType!)
  'st-undefined': ['Nicht aufgezeichnet', 'Not recorded'],
  'st-surface-water-stream': ['Oberflächenwasser (Strom)', 'Surface Water (Stream)'],
  'st-surface-water-pond': ['Oberflächenwasser (Teich)', 'Surface Water (Pond)'],
  'st-ground-water': ['Grundwasser', 'Groundwater'],
  'st-water-precipitation': ['Niederschlag', 'Precipitation'],
  'st-sediment': ['Sediment', 'Sediment'],
  'st-soil': ['Boden', 'Soil'],
  'st-vegetation': ['Vegetation', 'Vegetation'],
  'st-organism': ['Organismus', 'Organism'],
  'st-fish': ['Fisch', 'Fish'],
  'st-insect': ['Insekt', 'Insect'],

  // '': [''],
} as const

// https://fnando.github.io/i18n/
export const i18n = new I18n({
  'en-US': Object.fromEntries( Array.from(Object.entries(translations)).map(([k,v]) => v.length>1 ? [k,v.at(-1)] : [k,k] ) ),
  'de-DE': Object.fromEntries( Array.from(Object.entries(translations)).map(([k,v]) => [k,v[0]] ) ),
}, { defaultLocale: 'en-US', missingBehavior: 'error',
  locale: navigator.language.toLowerCase()==='de' || navigator.language.toLowerCase().startsWith('de-')?'de-DE':'en-US' })

export function tr(k :keyof typeof translations) { return i18n.t(k) }
