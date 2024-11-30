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
  //     'English (en-US)': ['Deutsch (de-DE)'],   (but key can't contain dots!)
  // For long texts: 'key': ['Deutsch (de-DE)', 'English (en-US)'],
  'Home': ['Hauptseite'],
  'About': ['Über'],

  'Cancel': ['Abbrechen'],
  'Back': ['Zurück'],
  'Edit': ['Bearbeiten'],
  'Delete': ['Löschen'],
  'New': ['Neu'],
  'Save & Close': ['Speichern & Schließen'],
  'Save': ['Speichern'],
  'Yes': ['Ja'],
  'No': ['Nein'],
  'Discard': ['Verwerfen'],
  'Warnings': ['Warnungen'],
  'Error': ['Fehler'],
  'No items': ['Keine Einträge'],
  'Understood': ['Verstanden'],
  'Select': ['Auswählen'],
  'From Template': ['Aus Vorlage'],

  // editors
  'Required': ['Eingabe erforderlich'],
  'Recommended': ['Eingabe empfohlen'],
  'editor-warn-info': [
    'Bitte die Warnungen korrigieren, oder auf "Speichern & Schließen" klicken, um die Bearbeitung trotzdem abzuschließen.',
    'Please correct these warnings, or click "Save & Close" to finish editing despite the warnings.' ],
  'editor-err-info': [
    'Bitte den Fehler beheben, um Speichern zu ermöglichen.',
    'Please correct the error to allow saving.' ],
  'Name': ['Name'],
  'name-help-show': [
    'Zeige alle Regeln für gültige Namen',
    'Show all rules for valid names' ],
  'name-help-title': ['Regeln für gültige Namen', 'Rules for Valid Names'],
  'name-help-full': [
    'Namen müssen mit einem Buchstaben oder einer Zahl beginnen und müssen insgesamt mindestens zwei Zeichen lang sein.\n'
    +'Namen dürfen nicht beginnen mit: "CON", "PRN", "AUX", "NUL", oder "COM" bzw. "LPT" gefolgt von einer Zahl.\n'
    +'Namen dürfen nur Buchstaben (inkl. deutsche Umlaute und ß), Zahlen, sowie Leerzeichen und die Sonderzeichen Punkt (.), '
    +'Komma (,), Bindestrich (-), Unterstrich (_), und Klammern "()" enthalten.\nNamen dürfen nicht auf Leerzeichen oder einem Punkt enden.\n'
    +'Namen werden nicht übersetzt, daher wird empfohlen, englische Namen zu verwenden.',
    'Names must begin with a letter or number and must be at least two characters long in total.\n'
    +'Names may not begin with: "CON", "PRN", "AUX", "NUL", or "COM" or "LPT" followed by a number.\n'
    +'Names may include letters (incl. German umlauts and ß), numbers, and spaces as well as the special characters period (.), '
    +'comma (,), minus (-), underscore (_), and parentheses "()".\nNames may not end on a space or period.\n'
    +'Names are not translated, so English is recommended.'
  ],
  'Notes': ['Notizen'],
  'notes-help': [
    'Etwaige Notizen.',
    'Optional notes.' ],
  'Description': ['Beschreibung'],
  'desc-help': [
    'Etwaige Beschreibung.',
    'Optional description.' ],
  'duplicate-name': [
    'Dieser Name wird bereits verwendet',
    'This name is already being used' ],

  // list editor
  'list-editor-disabled-new': [
    'Bitte zunächst speichern, um hier Änderungen zu ermöglichen.',
    'Please first save to allow changes here.' ],

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
    'Messwerte dieses Typs sollten diesen Wert nicht unterschreiten. (Die Einstellung "Nachkommastellen" wirkt sich auf dieses Eingabefeld aus.)',
    'Measurement values of this type should not be below this value. (The setting "Precision" influences this input field.)' ],
  'Maximum': ['Maximalwert'],
  'max-help': [
    'Messwerte dieses Typs sollten diesen Wert nicht überschreiten. (Die Einstellung "Nachkommastellen" wirkt sich auf dieses Eingabefeld aus.)',
    'Measurement values of this type should not be above this value. (The setting "Precision" influences this input field.)' ],
  'Precision': ['Nachkommastellen'],
  'precision-help': [
    'Die Anzahl der Nachkommastellen, die im Messwert erlaubt sind.',
    'The number of decimal places allowed after the decimal point in the measurement value.' ],

  // editor: coords
  'Lat': ['Lat'],
  'Lon': ['Lon'],
  'Latitude': ['Breitengrad'],
  'Longitude': ['Längengrad'],
  'geo-permission-denied': [
    'Standortzugriff wurde abgelehnt. Bitte erlauben Sie dieser Seite/App den Zugriff auf den aktuellen Standort.',
    'Geolocation permission denied. Please allow this page/app to access your current position.' ],
  'geo-unavailable': [
    'Standort nicht verfügbar.',
    'Geolocation not available.' ],
  'geo-timeout': [
    'Zeitüberschreitung bei der Ermittlung des Standorts. Bitte nochmal versuchen.',
    'Timed out trying to get current position. Please try again.' ],
  'geo-unknown-error': [
    'Unerwarteter / unbekannter Fehler beim Standortzugriff.',
    'Unexpected / unknown error when trying to access position.' ],
  'nom-coord': ['Soll-Koord.', 'Nominal Coord.'],
  'act-coord': ['Ist-Koord.', 'Actual Coord.'],
  'nom-coord-help': [
    'Die Soll-Koordinaten geben den Ort an, an dem eine Probe im Normalfall genommen wird. (Referenzsystem EPSG:4326, "WGS84")',
    'The nominal coordinates specify the place where a sample is normally taken. (Reference system EPSG:4326, "WGS84")' ],
  'invalid-coords': [
    'Ungültige Koordinaten.',
    'Invalid coordinates.' ],
  'Please wait': ['Bitte warten'],
  'Use current location': ['Aktuellen Standort verwenden'],
  'Show on map': ['Auf Karte zeigen'],

  // editor: trip template
  'new-loc-from-temp': [
    'Neuer Messpunkt aus Vorlage',
    'New Sampling Location from Template' ],

  // dialogs
  'Unsaved Changes': ['Nicht gespeicherte Änderungen'],
  'unsaved-changes': [
    'Die Eingaben wurden noch nicht gespeichert.',
    'The changes were not yet saved.'],
  'cannot-undo-discard': [
    'Verworfene Änderungen können nicht wiederhergestellt werden!',
    'Discarded changes cannot be recovered!' ],
  'Confirm Deletion': ['Löschen Bestätigen'],
  'confirm-delete': [
    'Diese Daten wirklich löschen?',
    'Really delete this data?' ],
  'cannot-undo-delete': [
    'Gelöschte Daten können nicht wiederhergestellt werden!',
    'Deleted data cannot be recovered!' ],

  // other
  'Error: No Storage Available': ['Fehler: Kein Speicher verfügbar'],
  'alert-no-storage-text': [
    'Dein Browser hat keinen Speicher zur Verfügung gestellt. Diese App kann nicht im "privaten" modus'
    +' verwendet werden. Stelle außerdem sicher, dass du keine Browser-Plugins hast, die Inhalt sperren könnten'
    +' (z.B. Werbungs-Blocker); falls du solche Plugins hast, müssen sie für diese App deaktiviert werden.',
    'Your browser has not made any storage available. This app cannot be used in "private browsing" mode,'
    +' and make sure you don\'t have any browser plugins enabled that may block content (ad blockers etc.).'
    +' If you do, you need to disable them for this app.' ],

  // types
  'Sampling Trip': ['Messfahrt'],
  'Sampling Trips': ['Messfahrten'],
  'Sampling Trip Template': ['Messfahrt-Vorlage'],
  'Sampling Trip Templates': ['Messfahrt-Vorlagen'],
  'Sampling Location': ['Messpunkt'],
  'Sampling Locations': ['Messpunkte'],
  'Sampling Location Template': ['Messpunkt-Vorlage'],
  'Sampling Location Templates': ['Messpunkt-Vorlagen'],
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
  'trip-temp': ['Fahrt-Vorl.', 'Trip Templ.'],
  'Location': ['Messpunkt'],
  'loc-temp': ['Messpunkt-Vorl.', 'Location Templ.'],
  'meas': ['Messung', 'Meas.'],
  'meas-type': ['Messtyp', 'Meas. Type'],
  'Coords': ['Koord.'],
  'samp-temp': ['Messpunkt-Vorl.', 'Sample Templ.'],

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
  'duplicate-trip-id': [
    'Es existiert bereits eine Messfahrt mit diesem Namen an demselben Anfangs-Datum. Bitte den Messfahrt-Namen ergänzen, um diese zwei Messfahrten zu unterscheiden.',
    'There is already a sampling trip with this name on the same start date. Please modify the sampling trip\'s name to differentiate these two sampling trips.' ],

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
