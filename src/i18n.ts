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
  'Information': ['Informationen'],
  'Start': ['Starten'],
  'Help': ['Hilfe'],
  'No input': ['Keine Eingabe'],
  'Caution': ['Achtung'],
  'Expand': ['Erweitern'],
  'Collapse': ['Verkleinern'],
  'Next': ['Nächste'],
  'Procedures': ['Prozeduren'],
  'All completed': ['Alle erledigt'],

  // import-export
  'Export': ['Export'],
  'export-as-csv': ['als CSV (nur Zusammenfassung)', 'as CSV (summary only)'],
  'export-as-json': ['als JSON (vollständig; für import)', 'as JSON (complete; for import)'],
  'export-as-zip': ['als ZIP (empfohlen; CSV+JSON)', 'as ZIP (recommended; CSV+JSON)'],
  'import-export': ['Daten-Import/-Export', 'Data Import/Export'],
  'Export All Data': ['Alle Daten Exportieren'],
  'Import Data': ['Daten Importieren'],
  'export-help': [
    'Einzelne Messprozeduren und -protokolle können über den jeweiligen "Export" Knopf exportiert werden.'
    +' Im JSON Format exportierte Dateien können dann hier wieder importiert werden.',
    'Individual sampling procedures and logs can be exported by the associated "Export" button.'
    +' Files exported in the JSON format can then be imported here.' ],
  'export-all-help': [
    'Mit dieser Funktion werden sämtliche Daten dieser Seite/App ins JSON-Format exportiert.',
    'This function allows you to export all data from this page/app in the JSON format.' ],
  'import-help': [
    'Mit dieser Funktion können zuvor aus dieser Seite/App exportierten Daten im JSON-Format wieder importiert werden.',
    'This function allows you to import data that was previously exported from the page/app in the JSON format.' ],
  'import-with-errors': [
    'Es gab beim Import der Daten folgende Fehler:',
    'The following errors occurred during import of the data:' ],
  'import-success': ['Import erfolgreich!', 'Import successful!'],
  'processed-objects': [
    { zero: 'Keine Objekte verarbeitet.', one: 'Ein Objekt verarbeitet:', other: '%{count} Objekte verarbeitet:' },
    { zero: 'No objects processed.', one: 'One object processed:', other: '%{count} objects processed:' } ],
  'import-res-unchanged': ['Unverändert', 'Unchanged'],
  'import-res-overwritten': ['Überschrieben', 'Overwritten'],
  'import-res-skipped': ['Nicht importiert', 'Not imported'],
  'import-res-new': ['Neu', 'New'],
  'import-bad-log': [
    'Das Objekt mit folgendem Schlüssel wurde nicht als Messprotokoll erkannt:',
    'The object with the following key was not recognized as a sampling log:' ],
  'import-bad-proc': [
    'Das Objekt mit folgendem Schlüssel wurde nicht als Messprozedur erkannt:',
    'The object with the following key was not recognized as as sampling procedure:' ],
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
  'export-no-locations': [
    'Diese Messprozedur enthält keine Messstellen, die exportierte CSV Datei wird leer sein.',
    'This sampling log doesn\'t contain any sampling locations, the exported CSV file will be empty.' ],

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
    +'Namen dürfen nur einmal pro Datentyp (Messstelle, Messtyp, usw.) verwendet werden.',
    'Names must begin with a letter or number and must be at least two characters long in total.\n'
    +'Names may not begin with: "CON", "PRN", "AUX", "NUL", or "COM" or "LPT" followed by a number.\n'
    +'Names may include letters (incl. German umlauts and ß), numbers, and spaces as well as the special characters period (.), '
    +'minus (-), underscore (_), and parentheses "()".\nNames may not end on a space or period.\n'
    +'Names are not translated, so English is recommended.\n'
    +'Names must be unique across all entries of the same kind (sampling location, measurement type, etc.).'
  ],
  'Notes': ['Notizen'],
  'Instructions': ['Anleitung'],
  'notes-help': [
    'Notizen dienen der Aufzeichnung und Auswertung von Messungen und werden im CSV-Format mit exportiert.',
    'Notes serve the recording and analysis of measurements and are included in the export in CSV format.' ],
  'inst-help': [
    'Anleitungen dienen der Hilfe bei Durchführung der Messungen, und sind daher im CSV Export nicht enthalten.',
    'Instructions serve to help conduct measurements, and are therefore not exported in the CSV format.' ],
  'inst-see-notes': [
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
  'saved-pl': ['Gespeicherte', 'Saved'],
  'planned-pl': ['Geplante', 'Planned'],
  'list-editor-disabled-new': [
    'Bitte zunächst speichern, um hier Änderungen zu ermöglichen.',
    'Please save first to allow changes here.' ],
  'Move up': ['Nach oben'],
  'Move down': ['Nach unten'],

  // editor: meas-type
  'meas-name-help': [
    'Beispiele: "Temperature", "ph", "Leitfähigkeit" bzw. "Conductivity", "O2 relative", usw.',
    'Examples: "Temperature", "pH", "Conductivity", "O2 relative", etc.' ],
  'Unit': ['Messeinheit'],
  'unit-help': [
    // the reason we do the following is so "units" stays a required field (force user to think about it)
    'Einheit des gemessenen Werts. Wenn der Messwert keine Einheiten hat, hier "unitless", "dimensionless",'
    +' einen einzelnen Bindestrich (-), oder den Namen nochmals eingeben.',
    'The unit of the measurement value. If the value has no units, enter either "unitless", "dimensionless",'
    +' a single dash (-), or enter the name again.' ],
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
  'meas-type-inst-help': [
    'Optionale Anleitung, z.B. bei besonderen Messverfahren.',
    'Optional instructions, for example for special measurement procedures.' ],
  'new-meas-from-temp': [
    'Neue Messung aus Vorlage',
    'New Measurement from Template' ],
  'meas-type-duplicate': [
    'Bei Messungen mit gleichartigen Messtypen an einer Probe wird nur die neuste dieser Messungen im CSV Format exportiert.'
    +' Hinweis: Wenn Messungen des gleichen Typs gewünscht sind, können auch mehrere Proben des gleichen Typs angelegt werden.',
    'When one sample has multiple measurements of the same type, only the newest of these measurements will be exported in the CSV format.'
    +' Hint: If multiple measurements of the same type are desired, multiple samples of the same type may be defined.' ],

  // editor: location (template) & coords
  'loc-short-desc-help': [
    'Optionale Kurzbeschreibung, die beim Identifizieren der Messstelle helfen soll. Z.B. kann der Name eine kurze Identifikationsnummer'
    +' sein und diese Kurzbeschreibung ein ausgeschriebener Name der Stelle, oder umgekehrt. Wird im CSV-Format nicht mit exportiert.',
    'Optional short description, intended to help identify this sampling location. For example, the "Name" can be a short identifier'
    +' and this short description can be the full name of the sampling location, or vice versa. Not included in the export in CSV format.' ],
  'loc-inst-temp-help': [
    'Optionale Anleitung für die Messstelle, z.B. Hilfe zum Auffinden, mögliche Anfahrtswege, usw.',
    'Optional instructions for the sampling location, for example, help in finding or reaching it, etc.' ],
  'loc-inst-help': [ 'Anleitung für die Messstelle.', 'Instructions for the sampling location.' ],
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
    'Die Soll-Koordinaten geben den Ort an, an dem eine Probe im Normalfall genommen wird.',
    'The nominal coordinates specify the place where a sample is normally taken.' ],
  'act-coord': ['Ist-Koord.', 'Actual Coord.'],
  'act-coord-help': [
    'Die Ist-Koordinaten geben den Ort an, an dem eine Probe in Wirklichkeit genommen wurde.',
    'The actual coordinates specify the place where a sample was actually taken.' ],
  'coord-help': [
    'Koordinaten im Format "Lat,Lon" (z.B. aus Google Maps) können in eins beider Felder mit Copy & Paste eingefügt werden.',
    'Coordinates in the format "Lat,Lon" (e.g. from Google Maps) can be inserted into either field via Copy & Paste.' ],
  'coord-ref': [ '(Referenzsystem EPSG:4326, "WGS84")', '(Reference system EPSG:4326, "WGS84")' ],
  'invalid-coords': [
    'Ungültige Koordinaten.',
    'Invalid coordinates.' ],
  'Please wait': ['Bitte warten'],
  'Location': ['Standort'],
  'Use current location': ['Aktuellen Standort verwenden'],
  'Show on map': ['Auf Karte zeigen'],
  'Map': ['Karte'],
  'loc-start-time-help': [
    'Ankunftszeit an der Messstelle bzw. Beginn der Messungen.',
    'Arrival time at the sampling location / beginning of measurements.' ],
  'loc-end-time-help': [
    'Ende der Messungen bzw. Abfahrtszeit von der Messstelle.',
    'End of measurements / departure time from the sampling location.' ],
  'loc-notes-help': ['Optionale Notizen zur Messstelle im Allgemeinen.', 'Optional notes about the sampling location in general.'],
  'planed-samp-remain': [
    { zero: 'Alle geplanten Proben gespeichert', one: 'Eine geplante Probe übrig', other: '%{count} geplante Proben übrig' },
    { zero: 'All planned samples saved', one: 'One planned sample left', other: '%{count} planned samples left' } ],
  'Task List': ['Aufgabenliste'],
  'tasklist-temp-help': [
    'Optionale Aufgabenliste: Jede Zeile in dieser Eingabe wird zu einem Punkt auf der Liste der an dieser Messstelle zu erledigenden Aufgaben.'
    +' Erledigte Aufgaben sind im CSV Export enthalten.',
    'Optional task list: Every line in this input becomes one item on the list of tasks to complete at this sampling location.'
    +' Completed tasks are exported in the CSV format.' ],
  'tasklist-empty-lines': [
    'Die Aufgabenliste enthält leere Zeilen.',
    'The task list contains empty lines.' ],
  'tasklist-duplicates': [
    'Die Aufgabenliste enthält Dopplungen.',
    'The task list contains duplicate items.' ],
  'tasklist-help': [
    'Aufgaben, die an dieser Messstelle zu erledigen sind. Erledigte Aufgaben sind im CSV Export enthalten.',
    'Tasks that are to be completed at this sampling location. Completed tasks are exported in the CSV format.' ],
  'task-not-completed': [
    { zero: 'Alle Aufgaben erledigt', one: 'Eine Aufgabe nicht erledigt', other: '%{count} Aufgaben nicht erledigt' },
    { zero: 'All tasks complete', one: 'One task not completed', other: '%{count} tasks not completed' } ],
  'Completed': ['Erledigt'],

  // editor: sampling procedure
  'proc-inst-temp-help': [
    'Optionale zusätzliche Anleitung für die Messprozedur, z.B. vorzubereitende Geräte und Materialien, usw.',
    'Optional additional instructions for the sampling procedure, e.g. equipment and materials to prepare, etc.' ],
  'new-loc-from-temp': [
    'Neue Messstelle aus Vorlage',
    'New Sampling Location from Template' ],
  'common-samples': [
    'Gleichartige Proben',
    'Uniform Samples' ],
  'common-samples-help': [
    'Wenn an allen Messstellen der Messprozedur die gleichen Proben mit den gleichen Messungen genommen werden, können diese hier festgelegt werden.'
    +' Wenn für einzelne Messstellen andere Proben festgelegt werden, haben sie Vorrang vor den Proben in diesem Abschnitt.',
    'If the same samples with the same measurements are to be taken at all locations in this procedure, they can be defined here.'
    +' If individual sampling locations have different samples defined, they override the samples in this section.' ],
  'Checklist': ['Checkliste'],
  'checklist-temp-help': [
    'Optionale Checkliste: Jede Zeile in dieser Eingabe wird zu einem Punkt auf der Kontrollliste zur Hilfe bei der Vorbereitung dieser Messprozedur.'
    +' Die Checkliste ist im CSV Export nicht enthalten.',
    'Optional checklist: Every line in this input becomes one item on the checklist for help in preparation of this sampling procedure.'
    +' The checklist is not exported in the CSV format.' ],
  'checklist-empty-lines': [
    'Die Checkliste enthält leere Zeilen.',
    'The checklist contains empty lines.' ],
  'checklist-duplicates': [
    'Die Checkliste enthält Dopplungen.',
    'The checklist contains duplicate items.' ],
  'auto-set-end-time': [
    'Beim Speichern End-Zeit automatisch auf aktuelle Uhrzeit setzen',
    'Automatically set end time to current time when saving' ],
  'auto': ['autom.'],
  'not set': ['nicht gesetzt'],
  'Timezone': ['Zeitzone'],
  'timezone-help': [
    'Zeitzone der Zeiten ist die dieses Geräts, meist Ortszeit.',
    'Timezone of the times is that of this device, usually local time.' ],

  // editor: sampling log
  'proc-inst-help': [
    'Anleitung für die Messprozedur.',
    'Instructions for the sampling procedure.' ],
  'Start time': ['Anfangs-Zeit'],
  'log-start-time-help': [ 'Wann das Messprotokoll bzw. die Messdurchführung begonnen wurde.', 'When the sampling / sampling log was started.' ],
  'End time': ['End-Zeit'],
  'log-end-time-help': [ 'Wann das Messprotokoll bzw. die Messdurchführung endete.', 'When the sampling / sampling log ended.' ],
  'Persons': ['Personen'],
  'persons-help': ['Optional. Welche Personen an der Probenahme beteiligt waren.', 'Optional. Who was involved in the sampling.'],
  'Weather': ['Wetter'],
  'weather-help': ['Optional. Wie das Wetter während der Probenahme war.', 'Optional. How the weather during the sampling was.'],
  'log-notes-help': ['Optionale Notizen zum Messprotokoll im Allgemeinen.', 'Optional notes about the sampling log in general.'],
  'Time': ['Zeit'],
  'Times': ['Zeiten'],
  'Use current time': ['Aktuelle Zeit verwenden'],
  'new-log-from-proc': [
    'Neues Messprotokoll aus Messprozedur',
    'New Sampling Log from Procedure' ],
  'checklist-help': [
    'Kontrollliste zur Hilfe bei der Vorbereitung dieser Messprozedur. Die Checkliste ist im CSV Export nicht enthalten.',
    'Checklist for help in preparation of this sampling procedure. The checklist is not exported in the CSV format.' ],
  'checklist-complete': [
    { zero: 'Checkliste war leer', one: 'Checklist-Aufgabe erledigt', other: 'Alle %{count} Checklist-Aufgaben erledigt' },
    { zero: 'Checklist was empty', one: 'Checklist task completed', other: 'All %{count} checklist tasks completed' } ],
  'Show checklist': ['Checkliste anzeigen'],
  'check-not-completed': [
    { zero: 'Alle Checklist-Aufgaben erledigt', one: 'Eine Checklist-Aufgabe nicht erledigt', other: '%{count} Checklist-Aufgaben nicht erledigt' },
    { zero: 'All checklist tasks complete', one: 'One checklist task not completed', other: '%{count} checklist tasks not completed' } ],
  'planed-loc-remain': [
    { zero: 'Alle geplanten Messstellen gespeichert', one: 'Eine geplante Messstelle übrig', other: '%{count} geplante Messstellen übrig' },
    { zero: 'All planned sampling locations saved', one: 'One planned sampling location left', other: '%{count} planned sampling locations left' } ],

  // editor: sample (template)
  'Sample Type': ['Art der Probe'],
  'Short Description': ['Kurzbeschreibung'],
  'samp-short-desc-help': [
    'Optionale Kurzbeschreibung, die beim Identifizieren der Probe helfen soll. Wird im CSV-Format mit exportiert.',
    'Optional short description, intended to help identify this sample. Included in the export in CSV format.' ],
  'specify-in-desc': ['in Kurzbeschreibung angeben', 'specify in Short Description'],
  'new-samp-from-temp': [
    'Neue Probe aus Vorlage',
    'New Sample from Template' ],
  'samp-inst-temp-help': [
    'Optionale Anleitung für die Probenahme, z.B. Menge, Filterung, usw.',
    'Optional instructions for the sample procedure, e.g. amount, filtering, etc.' ],
  'samp-inst-help': [
    'Anleitung für die Probenahme.',
    'Instructions for the sample procedure.' ],
  'samp-notes-help': [
    'Optionale Notizen zur Probe, z.B. Menge, Kommentare zur Qualität, usw.',
    'Optional notes about the sample, e.g. amount, comments about quality, etc.' ],
  'Subjective Quality': ['Subjektive Qualität'],
  'qf-desc-good': [
    'Keine offensichtlich erkennbaren Qualitätsprobleme',
    'No obviously identifiable quality problems' ],
  'qf-desc-quest': [
    'Verdacht auf Qualitätsprobleme, z.B. mögliche Verunreinigung, ungewöhnlicher Geruch, usw. (in "Notizen" beschreiben)',
    'Suspected quality problems, e.g. possible contamination, unusual smell, etc. (describe in "Notes")' ],
  'qf-desc-bad': [
    'Eindeutige Qualitätsprobleme, z.B. zu geringe Probenmenge, offensichtliche Verunreinigung, usw. (in "Notizen" beschreiben)',
    'Obvious quality problems, e.g. too small sample amount, obvious contamination, etc. (describe in "Notes")' ],
  'qual-no-notes': [
    'Subjektive Qualität als "Fraglich" oder "Schlecht" angegeben - bitte genaueres in Notizen beschreiben.',
    'Subjective quality marked as "Questionable" or "Bad" - please provide details in the "Notes".' ],
  'planed-meas-remain': [
    { zero: 'Alle geplanten Messungen gespeichert', one: 'Eine geplante Messung übrig', other: '%{count} geplante Messungen übrig' },
    { zero: 'All planned measurements saved', one: 'One planned measurement left', other: '%{count} planned measurements left' } ],
  'meas-list-help': [
    'Messwerte können in der folgenden Liste direkt eingegeben werden und werden bei fehlerfreier Eingabe automatisch gespeichert und'
    +' der Zeitstempel wird automatisch aktualisiert.',
    'Measurement values can be entered directly in the following list and are saved automatically when they are entered without errors,'
    +' and the timestamp is automatically updated.' ],
  'meas-list-help-important': [
    'Wenn ein Messwert rot hinterlegt wird, wurde er NICHT gespeichert.',
    'When a measurement value is highlighted red, it was NOT saved.' ],

  // editor: measurement
  'Timestamp': ['Zeitstempel'],
  'Value': ['Messwert'],
  'meas-value-help': [ 'Der gemessene Wert. Muss in dem Bereich liegen:', 'The measured value. Must be in the range:' ],
  'meas-time-help': [
    'Wann die Messung genommen bzw. aufgezeichnet wurde. Zeitzone ist die dieses Geräts (meist Ortszeit)',
    'When the measurement was taken / recorded. Timezone is that of this device (usually local time)' ],
  'meas-type-help': ['Messtyp.', 'Type of the measurement.'],
  'sel-meas-type': [ 'Messtyp Auswählen', 'Select Measurement Type' ],
  'no units': ['keine Einheit'],
  'not specified': ['nicht angegeben'],
  'precision': ['Erlaubte Nachkommastellen:', 'Allowed digits after decimal:'],
  'meas-inst-help': [
    'Anleitung für diesen Messtyp. Dieses Feld wird aus dem "Messtyp" kopiert und kann hier nicht bearbeitet werden.',
    'Instructions for this measurement type. This field is copied from the "measurement type" and cannot be edited here.' ],

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
  'beta-warning-title': [ 'ACHTUNG: Beta-Test-Version!', 'WARNING: Beta Test Version!' ],
  'beta-warning-text': [
    'Dies ist eine Beta-Test-Version, welche sicherlich noch einige Fehler enthält. DATEN KÖNNEN VERLOREN GEHEN. Es sollten immer regelmäßig '
    +'Backups mit der "Export" Funktion erstellt werden. Diese Meldung wird entsprechend dem aktuellen Entwicklungsstatus aktualisiert.',
    'This is a beta testing version which certainly still contains bugs. DATA MAY BE LOST. You should always perform regular backups via the '
    +'"Export" function. This message will be updated according to the current state of development.' ],
  'beta-warning-dismiss': [
    'Ich verstehe - diese Warnung 30 Tage nicht anzeigen',
    'I understand - don\'t show this warning for 30 days' ],
  'temp-copied-readonly': [
    'Dieses Feld ist aus der Vorlage kopiert und kann hier nicht bearbeitet werden.',
    'This field is copied from the template and cannot be edited here.' ],
  'dot-minus-hack': [
    'Wenn auf der Handy-Tastatur das Minuszeichen fehlt, kann auch zweimal Punkt (.) gedrückt werden.',
    'If your smartphone keyboard is missing the minus sign, you can also press period (.) twice.' ],

  // types
  'Sampling Log': ['Messprotokoll'],
  'Sampling Logs': ['Messprotokolle'],
  'Sampling Procedure': ['Messprozedur'],
  'Sampling Procedures': ['Messprozeduren'],
  'Sampling Location': ['Messstelle'],
  'Sampling Locations': ['Messstellen'],
  'Sampling Location Template': ['Messstellen-Vorlage'],
  'Sample': ['Probe'],
  'Samples': ['Proben'],
  'Sample Template': ['Vorlage für Probe'],
  'Measurement': ['Messung'],
  'Measurements': ['Messungen'],
  'Measurement Type': ['Messtyp'],
  'Measurement Types': ['Messtypen'],
  'Coordinates': ['Koordinaten'],
  'sampling-locations': [
    { zero: 'keine Messstellen', one: 'eine Messstelle', other: '%{count} Messstellen' },
    { zero: 'no sampling locations', one: 'one sampling location', other: '%{count} sampling locations' } ],
  'measurements': [
    { zero: 'keine Messungen', one: 'eine Messung', other: '%{count} Messungen' },
    { zero: 'no measurements', one: 'one measurement', other: '%{count} measurements' } ],
  'samples': [
    { zero: 'keine Proben', one: 'eine Probe', other: '%{count} Proben' },
    { zero: 'no samples', one: 'one sample', other: '%{count} samples' } ],
  'tasks': [
    { zero: 'keine Aufgaben', one: 'eine Aufgabe', other: '%{count} Aufgaben' },
    { zero: 'no tasks', one: 'one task', other: '%{count} tasks' } ],
  'comp-tasks': [  // the count here is actually the total tasks, this is prefixed with "completed task count" + "/"
    { one: '1 erledigte Aufgabe', other: '%{count} erledigte Aufgaben' },
    { one: '1 completed task', other: '%{count} completed tasks' } ],
  // partially abbrev. for breadcrumbs
  'Templates': ['Vorlagen'],
  'Logs': ['Protokolle'],
  'Log': ['Protokoll'],
  'proc': ['Proz.', 'Proc.'],
  'samp-loc': ['Stelle', 'Location'],
  'loc-temp': ['Stell.-Vorl.', 'Loc.Templ.'],
  'meas': ['Mess.', 'Meas.'],
  'meas-type': ['Typ', 'Meas.Type'],
  'Coords': ['Koord.'],
  'samp': ['Probe', 'Samp.'],
  'samp-temp': ['Proben-Vorl.', 'Samp.Templ.'],

  // types problems
  'No start time': ['Keine Anfangs-Zeit'],
  'No end time': ['Keine End-Zeit'],
  'No sampling locations': ['Keine Messstellen'],
  'No samples': ['Keine Proben'],
  'No units': ['Keine Messeinheit'],
  'No minimum value': ['Kein Minimalwert'],
  'No maximum value': ['Kein Maximalwert'],
  'No precision': ['Keine Anzahl der Nachkommastellen'],
  'No timestamp': ['Kein Zeitstempel'],
  'No measurement value': ['Kein Messwert'],
  'No measurements': ['Keine Messungen'],
  'no-samp-log-loc': ['Keine Messstellen in der Prozedur', 'No sampling locations in this procedure'],
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
  'duplicate-log-id': [
    'Es existiert bereits ein Messprotokoll mit diesem Namen an demselben Anfangs-Datum.'
    +' Bitte as Messprotokoll ergänzen (Namen oder Datum), um diese zwei Protokolle zu unterscheiden.',
    'There is already a sampling log with this name on the same start date.'
    +' Please modify the sampling log (name or date) to differentiate these two logs.' ],
  'samp-type-undef': [
    'Art der Probe nicht festgelegt.',
    'Sample type not defined.' ],
  'quality-undef': [
    'Subjektive Qualität nicht angegeben.',
    'Subjective quality not specified.' ],
  'times-order': [
    'Die End-Zeit liegt vor der Anfangs-Zeit.',
    'The end time is before the start time.' ],
  'samp-other-no-desc': [
    'Probentyp "Andere" ausgewählt, aber keine Kurzbeschreibung hinterlegt',
    'Sample type "other" selected, but no short description entered' ],

  // settings
  'Settings': ['Einstellungen'],
  'hide-help-texts': [ 'Hilfetexte verstecken', 'Hide help texts' ],

  // sample types (Remember to keep in sync with SampleType!)
  'st-undefined': ['Unbekannt (nicht festgelegt/aufgezeichnet)', 'Unknown (not defined/recorded)'],
  'st-surface-water': ['Oberflächenwasser (allgemein)', 'Surface water (general)'],
  'st-surface-water-flowing': ['fließendes Oberflächenwasser', 'Flowing surface water'],
  'st-surface-water-standing': ['stehendes Oberflächenwasser', 'Standing surface water'],
  'st-ground-water': ['Grundwasser', 'Groundwater'],
  'st-water-precipitation': ['Niederschlag', 'Precipitation'],
  'st-sediment': ['Sediment', 'Sediment'],
  'st-soil': ['Boden', 'Soil'],
  'st-vegetation': ['Vegetation', 'Vegetation'],
  'st-organism': ['Organismus', 'Organism'],
  'st-fish': ['Fisch', 'Fish'],
  'st-insect': ['Insekt', 'Insect'],
  'st-data-logger': ['Datenlogger auslesen', 'Read out data logger'],
  'st-probe': ['Sonde auslesen', 'Read out probe data'],
  'st-other': ['Andere', 'Other'],
  // short sample type names
  'sts-undefined': ['Unbek.', 'Unknown'],
  'sts-surface-water': ['Oberfl.wasser', 'Surf.water'],
  'sts-surface-water-flowing': ['fließ.Wasser', 'Fl.water'],
  'sts-surface-water-standing': ['steh.Wasser', 'St.water'],
  'sts-ground-water': ['G.wasser', 'G.water'],
  'sts-water-precipitation': ['Nieders.', 'Precip.'],
  'sts-sediment': ['Sediment', 'Sediment'],
  'sts-soil': ['Boden', 'Soil'],
  'sts-vegetation': ['Veg.', 'Veg.'],
  'sts-organism': ['Organ.', 'Organ.'],
  'sts-fish': ['Fisch', 'Fish'],
  'sts-insect': ['Insekt', 'Insect'],
  'sts-data-logger': ['Logger', 'Logger'],
  'sts-probe': ['Sonde', 'Probe'],
  'sts-other': ['Andere', 'Other'],
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
