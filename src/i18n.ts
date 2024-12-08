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
  'Export CSV': ['CSV Export.'],
  'Information': ['Informationen'],

  // import-export
  'import-export': ['Daten-Import/-Export', 'Data Import/Export'],
  'Export All Data': ['Alle Daten Exportieren'],
  'Import Data': ['Daten Importieren'],
  'export-help': [
    'Mit dieser Funktion werden sämtliche Daten dieser Seite/App ins JSON-Format exportiert.',
    'This function allows you to export all data from this page/app in the JSON format.' ],
  'import-help': [
    'Mit dieser Funktion können zuvor aus dieser Seite/App exportierten Daten im JSON-Format wieder importiert werden.',
    'This function allows you to import data that was previously exported from the page/app in the JSON format.' ],
  'import-with-errors': [
    'Es gab beim Import der Daten folgende Fehler:',
    'The following errors occurred during import of the data:' ],
  'import-success': ['Import erfolgreich!', 'Import successful!'],
  'import-trip-info': [
    { zero: 'Keine Messfahrten importiert.', one: 'Eine Messfahrt importiert.', other: '%{count} Messfahrten importiert.' },
    { zero: 'No sampling trips imported.', one: 'One sampling trip imported.', other: '%{count} sampling trips imported.' } ],
  'import-temp-info': [
    { zero: 'Keine Messfahrt-Vorlagen importiert.', one: 'Eine Messfahrt-Vorlage importiert.', other: '%{count} Messfahrt-Vorlagen importiert.' },
    { zero: 'No sampling trip templates imported.', one: 'One sampling trip template imported.', other: '%{count} sampling trip templates imported.' } ],
  'import-bad-trip': [
    'Das Objekt mit folgendem Schlüssel wurde nicht als Messfahrt erkannt:',
    'The object with the following key was not recognized as a sampling trip:' ],
  'import-bad-temp': [
    'Das Objekt mit folgendem Schlüssel wurde nicht als Messfahrt-Vorlage erkannt:',
    'The object with the following key was not recognized as as sampling trip template:' ],
  'import-bad-explain': [
    'Dies kann z.B. dann passieren, wenn man einen älteren exportierten Datensatz in eine neuere Version der App lädt.'
    +' Ggf. muss der Datensatz manuell bearbeitet und ins neue Format gebracht werden, um ihn zu importieren.',
    'This can happen e.g. when trying to import an older exported dataset into a newer version of the app.'
    +' The data set may need to be edited manually to convert it to the newer format before it can be imported.' ],
  'import-overwrite': [
    'Das bestehende Objekt mit dem importierten Objekt überschreiben?',
    'Overwrite the existing object with the imported object?' ],
  'Existing object': ['Bestehendes Objekt'],
  'Imported object': ['Importiertes Objekt'],

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
  'name-help-full': [ // will be split on \n and turned into <li>s
    'Namen müssen mit einem Buchstaben oder einer Zahl beginnen und müssen insgesamt mindestens zwei Zeichen lang sein.\n'
    +'Namen dürfen nicht beginnen mit: "CON", "PRN", "AUX", "NUL", oder "COM" bzw. "LPT" gefolgt von einer Zahl.\n'
    +'Namen dürfen nur Buchstaben (inkl. deutsche Umlaute und ß), Zahlen, sowie Leerzeichen und die Sonderzeichen Punkt (.), '
    +'Bindestrich (-), Unterstrich (_), und Klammern "()" enthalten.\nNamen dürfen nicht auf Leerzeichen oder einem Punkt enden.\n'
    +'Namen werden nicht übersetzt, daher wird empfohlen, englische Namen zu verwenden.\n'
    +'Namen dürfen nur einmal pro Datentyp (Messpunkt, Messtyp, usw.) verwendet werden.',
    'Names must begin with a letter or number and must be at least two characters long in total.\n'
    +'Names may not begin with: "CON", "PRN", "AUX", "NUL", or "COM" or "LPT" followed by a number.\n'
    +'Names may include letters (incl. German umlauts and ß), numbers, and spaces as well as the special characters period (.), '
    +'minus (-), underscore (_), and parentheses "()".\nNames may not end on a space or period.\n'
    +'Names are not translated, so English is recommended.\n'
    +'Names must be unique across all entries of the same kind (sampling location, measurement type, etc.).'
  ],
  'Notes': ['Notizen'],
  'Description': ['Beschreibung'],
  'notes-help': [
    'Notizen dienen der Aufzeichnung und Auswertung von Messungen und werden im CSV-Format mit exportiert.',
    'Notes serve the recording and analysis of measurements and are included in the export in CSV format.' ],
  'desc-help': [
    'Beschreibungen dienen der Hilfe bei Durchführung der Messungen, und sind daher im CSV Export nicht enthalten.',
    'Descriptions serve to help conduct measurements, and are therefore not exported in the CSV format.' ],
  'desc-see-notes': [
    'Siehe auch das Feld "Notizen".',
    'See also the field "Notes".'],
  'duplicate-name': [
    'Dieser Name wird bereits verwendet',
    'This name is already being used' ],
  'Error Saving': ['Fehler beim Speichern'],
  'save-error-txt': [
    'Es ist beim Speichern ein Fehler aufgetreten, die Daten wurden möglicherweise nicht gespeichert. Wahrscheinlich muss die Applikation neu geladen werden.',
    'There was an error while saving the data. Your data may not be saved. It is likely you will have to reload the application.' ],
  'form-invalid': [
    'Ein oder mehrere obige Eingaben sind nicht gültig.',
    'One or more inputs above are not valid.' ],

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
  'meas-type-desc-help': [
    'Optionale Beschreibung, z.B. bei besonderen Messverfahren.',
    'Optional description, for example for special measurement procedures.' ],
  'new-meas-from-temp': [
    'Neue Messung aus Vorlage',
    'New Measurement from Template' ],
  'meas-type-duplicate': [
    'Bei Messungen mit gleichartigen Messtypen an einer Probe wird nur die neuste dieser Messungen im CSV Format exportiert.'
    +' Hinweis: Wenn Messungen des gleichen Typs gewünscht sind, können auch mehrere Proben des gleichen Typs angelegt werden.',
    'When one sample has multiple measurements of the same type, only the newest of these measurements will be exported in the CSV format.'
    +' Hint: If multiple measurements of the same type are desired, multiple samples of the same type may be defined.' ],

  // editor: location (template) & coords
  'loc-desc-help': [
    'Optionale Beschreibung des Messpunkts, z.B. Hilfe zum Auffinden, mögliche Anfahrtswege, usw.',
    'Optional description of the sampling location, for example to help in finding or reaching it, etc.' ],
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
  'nom-coord-help': [
    'Die Soll-Koordinaten geben den Ort an, an dem eine Probe im Normalfall genommen wird. (Referenzsystem EPSG:4326, "WGS84")',
    'The nominal coordinates specify the place where a sample is normally taken. (Reference system EPSG:4326, "WGS84")' ],
  'act-coord': ['Ist-Koord.', 'Actual Coord.'],
  'act-coord-help': [
    'Die Ist-Koordinaten geben den Ort an, an dem eine Probe in Wirklichkeit genommen wurde. (Referenzsystem EPSG:4326, "WGS84")',
    'The actual coordinates specify the place where a sample was actually taken. (Reference system EPSG:4326, "WGS84")' ],
  'invalid-coords': [
    'Ungültige Koordinaten.',
    'Invalid coordinates.' ],
  'Please wait': ['Bitte warten'],
  'Use current location': ['Aktuellen Standort verwenden'],
  'Show on map': ['Auf Karte zeigen'],
  'loc-start-time-help': [
    'Ankunftszeit am Messpunkt bzw. Beginn der Messungen. Zeitzone ist die dieses Geräts (meist Ortszeit)',
    'Arrival time at the sampling location / beginning of measurements. Timezone is that of this device (usually local time)' ],
  'loc-end-time-help': [
    'Abfahrtszeit vom Messpunkt bzw. Ende der Messungen. Zeitzone ist die dieses Geräts (meist Ortszeit)',
    'Departure time from the sampling location / end of measurements. Timezone is that of this device (usually local time)' ],
  'loc-notes-help': ['Optionale Notizen zum Messpunkt im Allgemeinen.', 'Optional notes about the sampling location in general.'],
  'checklist-help': [
    'Kontrollliste zur Hilfe bei der Vorbereitung dieser Messfahrt. Die Checkliste ist im CSV Export nicht enthalten.',
    'Checklist for help in preparation of this sampling trip. The checklist is not exported in the CSV format.' ],
  'check-not-completed': [
    { zero: 'Alle Checklist-Aufgaben erledigt', one: 'Eine Checklist-Aufgabe nicht erledigt', other: '%{count} Checklist-Aufgaben nicht erledigt' },
    { zero: 'All checklist tasks complete', one: 'One checklist task not completed', other: '%{count} checklist tasks not completed' } ],

  // editor: trip template
  'trip-desc-help': [
    'Optionale Beschreibung der Messfahrt, z.B. mitzunehmende Geräte und Materialien, usw.',
    'Optional description of the sampling trip, e.g. equipment and materials to take, etc.' ],
  'new-loc-from-temp': [
    'Neuer Messpunkt aus Vorlage',
    'New Sampling Location from Template' ],
  'common-samples': [
    'Gleichartige Proben',
    'Uniform Samples' ],
  'common-samples-help': [
    'Wenn an allen Messpunkten der Messfahrt die gleichen Proben mit den gleichen Messungen genommen werden, können diese hier festgelegt werden.'
    +' Wenn für einzelne Messpunkte andere Proben festgelegt werden, haben diese Vorrang vor den Proben in diesem Abschnitt.',
    'If the same samples with the same measurements are to be taken at all locations on this trip, they can be defined here.'
    +' If individual sampling locations have different samples defined, these override the samples in this section.' ],
  'Checklist': ['Checkliste'],
  'checklist-temp-help': [
    'Jede Zeile in dieser Eingabe wird ein Punkt auf der Kontrollliste zur Hilfe bei der Vorbereitung dieser Messfahrt. Die Checkliste ist im CSV Export nicht enthalten.',
    'Every line in this input becomes one item on the checklist for help in preparation of this sampling trip. The checklist is not exported in the CSV format.' ],
  'checklist-empty-lines': [
    'Die Checkliste enthält leere Zeilen.',
    'The checklist contains empty lines.' ],
  'checklist-duplicates': [
    'Die Checkliste enthält Dopplungen.',
    'The checklist contains duplicate items.' ],

  // editor: trip
  'Start time': ['Anfangs-Zeit'],
  'trip-start-time-help': [
    'Wann die Messfahrt begann. Zeitzone ist die dieses Geräts (meist Ortszeit)',
    'When the sampling trip began. Timezone is that of this device (usually local time)' ],
  'End time': ['End-Zeit'],
  'trip-end-time-help': [
    'Wann die Messfahrt endete. Zeitzone ist die dieses Geräts (meist Ortszeit)',
    'When the sampling trip ended. Timezone is that of this device (usually local time)' ],
  'Persons': ['Personen'],
  'persons-help': ['Welche Personen an der Probenahme beteiligt waren.', 'Who was involved in the sampling.'],
  'Weather': ['Wetter'],
  'weather-help': ['Wie das Wetter während der Probenahme war.', 'How the weather during the sampling trip was.'],
  'trip-notes-help': ['Optionale Notizen zur Messfahrt im Allgemeinen.', 'Optional notes about the sampling trip in general.'],
  'Now': ['Jetzt'],
  'Use current date and time': ['Aktuelles Datum und Uhrzeit verwenden'],
  'new-trip-from-temp': [
    'Neue Messfahrt aus Vorlage',
    'New Sampling Trip from Template' ],

  // editor: sample (template)
  'Sample Type': ['Art der Probe'],
  'new-samp-from-temp': [
    'Neue Probe aus Vorlage',
    'New Sample from Template' ],
  'samp-desc-help': [
    'Optionale Beschreibung der Probenahme, z.B. Menge, Filterung, usw.',
    'Optional description of the sample procedure, e.g. amount, filtering, etc.' ],
  'samp-notes-help': [
    'Optionale Notizen zur Probe, z.B. Qualität, Menge, usw.',
    'Optional notes about the sample, e.g. quality, amount, etc.' ],
  'Subjective Quality': ['Subjektive Qualität'],
  'qf-desc-good': [
    'Keine offensichtlich erkennbaren Qualitätsprobleme',
    'No obviously identifiable quality problems' ],
  'qf-desc-quest': [
    'Mögliche Qualitätsprobleme, z.B. mögliche Verunreinigung, ungewöhnlicher Geruch, usw. (ggf. in "Notizen" spezifizieren)',
    'Possible quality problems, e.g. possible contamination, unusual smell, etc. (describe in "Notes" if appropriate)' ],
  'qf-desc-bad': [
    'Eindeutige Qualitätsprobleme, z.B. zu geringe Probenmenge, offensichtliche Verunreinigung, usw. (ggf. in "Notizen" spezifizieren)',
    'Obvious quality problems, e.g. too small sample amount, obvious contamination, etc. (describe in "Notes" if appropriate)' ],

  // editor: measurement
  'Timestamp': ['Zeitstempel'],
  'Value': ['Messwert'],
  'meas-value-help': [ 'Der gemessene Wert. Muss in dem Bereich liegen:', 'The measured value. Must be in the range:' ],
  'meas-time-help': ['Wann die Messung genommen bzw. aufgezeichnet wurde.', 'When the measurement was taken / recorded.'],
  'meas-type-help': ['Messtyp', 'Type of the measurement'],
  'sel-meas-type': [ 'Messtyp Auswählen', 'Select Measurement Type' ],
  'no units': ['keine Einheit'],
  'not specified': ['nicht angegeben'],
  'precision': ['Erlaubte Nachkommastellen:', 'Allowed digits after decimal:'],
  'meas-desc-help': [
    'Beschreibung des Messtyps. Dieses Feld wird aus der "Messtyp" Maske kopiert und kann hier nicht bearbeitet werden.',
    'Description of the measurement type. This field is copied from the "measurement type" input and cannot be edited here.' ],

  // dialogs
  'Unsaved Changes': ['Nicht gespeicherte Änderungen'],
  'unsaved-changes': [
    'Die Änderungen an dem folgenden Datensatz wurden noch nicht gespeichert.',
    'The changes on the following item were not yet saved.'],
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
  'internal-error': [
    'Ein interner Fehler ist aufgetreten. Bitte diesen Fehler melden, inklusive einer Beschreibung der Schritte, wie es zu diesem Fehler kam - am besten wie er reproduziert werden kann.',
    'An internal error occurred. Please report this error, including a description of the steps before the error occurred - the best thing is a series of steps of how the error can be reproduced.' ],
  'beta-warning-title': [ 'ACHTUNG: Alpha-Testversion!', 'WARNING: Alpha Test Version!' ],
  'beta-warning-text': [
    'Dies is eine frühe Alpha-Testversion, welche sicherlich noch einige Fehler enthält. DATEN KÖNNEN VERLOREN GEHEN. Es sollten immer regelmäßig Backups mit der'
    +' "Export" Funktion erstellt werden, allerdings ist sehr wahrscheinlich, dass diese Backups dann NICHT wieder eingelesen werden können, wenn neue Versionen'
    +' der App herausgegeben werden. Sobald die App die Testphase verlässt und das Datenformat stabil ist, wird diese Meldung entsprechend aktualisiert.',
    'This is an early alpha testing version which certainly still contains bugs. DATA MAY BE LOST. You should always perform regular backups via the "Export"'
    +' function, however, it is very likely that you will not be able to restore these backups when new versions of this app are released.'
    +' As soon as the testing phase is completed and the data format has been stabilized, this message will be updated accordingly.' ],
  'beta-warning-dismiss': [
    'Ich verstehe - diese Warnung 7 Tage nicht anzeigen',
    'I understand - don\'t show this warning for 7 days' ],

  // types
  'Sampling Trip': ['Messfahrt'],
  'Sampling Trips': ['Messfahrten'],
  'Sampling Trip Template': ['Messfahrt-Vorlage'],
  'Sampling Trip Templates': ['Messfahrt-Vorlagen'],
  'Sampling Location': ['Messpunkt'],
  'Sampling Locations': ['Messpunkte'],
  'Sampling Location Template': ['Messpunkt-Vorlage'],
  'Sample': ['Probe'],
  'Samples': ['Proben'],
  'Sample Template': ['Vorlage für Probe'],
  'Measurement': ['Messung'],
  'Measurements': ['Messungen'],
  'Measurement Type': ['Messtyp'],
  'Coordinates': ['Koordinaten'],
  'sampling-locations': [
    { zero: 'keine Messpunkte', one: 'ein Messpunkt', other: '%{count} Messpunkte' },
    { zero: 'no sampling locations', one: 'one sampling location', other: '%{count} sampling locations' } ],
  'measurements': [
    { zero: 'keine Messungen', one: 'eine Messung', other: '%{count} Messungen' },
    { zero: 'no measurements', one: 'one measurement', other: '%{count} measurements' } ],
  'samples': [
    { zero: 'keine Proben', one: 'eine Probe', other: '%{count} Proben' },
    { zero: 'no samples', one: 'one sample', other: '%{count} samples' } ],
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
  'invalid-id': ['Ungültiger Identifikator', 'Invalid identifier'],
  'Invalid name': ['Ungültiger Name'],
  'Invalid timestamp': ['Ungültiger Zeitstempel'],
  'Invalid unit': ['Ungültige Messeinheit'],
  'Invalid value': ['Ungültiger Messwert'],
  'Invalid minimum value': ['Ungültiger Minimalwert'],
  'Invalid maximum value': ['Ungültiger Maximalwert'],
  'Invalid min/max value': ['Ungültiger Minimal-/Maximalwert'],
  'Invalid precision': ['Ungültige Anzahl der Nachkommastellen'],
  'Invalid sample type': ['Ungültiger Probentyp'],
  'Invalid quality': ['Ungültige Qualitätsangabe'],
  'Invalid measurement type': ['Ungültiger Messtyp'],
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
    'Es existiert bereits eine Messfahrt mit diesem Namen an demselben Anfangs-Datum.'
    +' Bitte die Messfahrt ergänzen (Namen oder Datum), um diese zwei Messfahrten zu unterscheiden.',
    'There is already a sampling trip with this name on the same start date.'
    +' Please modify the sampling trip (name or date) to differentiate these two sampling trips.' ],
  'samp-type-undef': [
    'Art der Probe nicht festgelegt.',
    'Sample type not defined.' ],
  'quality-undef': [
    'Subjektive Qualität nicht angegeben.',
    'Subjective quality not specified.' ],
  'times-order': [
    'Die End-Zeit liegt vor der Anfangs-Zeit.',
    'The end time is before the start time.' ],

  // settings
  'Settings': ['Einstellungen'],
  'hide-help-texts': [ 'Hilfetexte verstecken', 'Hide help texts' ],

  // sample types (Remember to keep in sync with SampleType!)
  'st-undefined': ['Unbekannt (nicht festgelegt/aufgezeichnet)', 'Unknown (not defined/recorded)'],
  'st-surface-water': ['Oberflächenwasser', 'Surface water'],
  'st-surface-water-flowing': ['Oberflächenwasser (Fließgewässer)', 'Surface water (flowing water)'],
  'st-surface-water-standing': ['Oberflächenwasser (stehendes Gewässer)', 'Surface water (standing water)'],
  'st-ground-water': ['Grundwasser', 'Groundwater'],
  'st-water-precipitation': ['Niederschlag', 'Precipitation'],
  'st-sediment': ['Sediment', 'Sediment'],
  'st-soil': ['Boden', 'Soil'],
  'st-vegetation': ['Vegetation', 'Vegetation'],
  'st-organism': ['Organismus', 'Organism'],
  'st-fish': ['Fisch', 'Fish'],
  'st-insect': ['Insekt', 'Insect'],
  'st-data-logger': ['Datenlogger auslesen', 'Read out data logger'],
  // quality flags (Remember to keep in sync with QualityFlag!)
  'qf-undefined': ['(nicht aufgezeichnet)', '(not recorded)'],
  'qf-good': ['Gut', 'Good'],
  'qf-questionable': ['Fraglich', 'Questionable'],
  'qf-bad': ['Schlecht', 'Bad'],

  // '': [''],
} as const

const isDe :boolean = navigator.language.toLowerCase()==='de' || navigator.language.toLowerCase().startsWith('de-')

// https://fnando.github.io/i18n/
export const i18n = new I18n({
  'en-US': Object.fromEntries( Array.from(Object.entries(translations)).map(([k,v]) => v.length>1 ? [k,v.at(-1)] : [k,k] ) ),
  'de-DE': Object.fromEntries( Array.from(Object.entries(translations)).map(([k,v]) => [k,v[0]] ) ),
}, { defaultLocale: 'en-US', locale: isDe?'de-DE':'en-US', missingBehavior: 'error' })

export function tr(k :keyof typeof translations) { return i18n.t(k) }

export function initI18n() {
  if (isDe) document.body.setAttribute('data-selected-language','de')
}
