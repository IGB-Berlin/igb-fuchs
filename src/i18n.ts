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

const translations :Record<string, [string,string]> = {
  // 'key': ['English', 'Deutsch'],
  'hello-world': ['Hello, World!', 'Hallo, Welt!'],
  'ok': ['OK', 'OK'],
  'cancel': ['Cancel', 'Abbrechen'],
  'take-picture': ['Take Picture', 'Bild Aufnehmen'],
  'accept': ['Accept', 'Annehmen'],
  'retry': ['Retry', 'Wiederholen'],
  'failed-camera': ['Failed to start camera', 'Konnte Kamera nicht starten'],
  'about': ['About', 'Über'],
  'save-and-close': ['Save & Close', 'Speichern & Schließen'],
  'alert-no-storage-title': ['Error: No Storage Available', 'Fehler: Kein Speicher verfügbar'],
  'alert-no-storage-text': [
    'Your browser has not made any local storage available. This app cannot be used in "private browsing" mode,'
    +' and make sure you don\'t have any browser plugins enabled that may block content (ad blockers etc.).'
    +' If you do, you need to disable them for this app.',
    'Dein Browser hat keinen lokalen Speicher zur Verfügung gestellt. Diese App kann nicht im "privaten" modus'
    +' verwendet werden. Stelle außerdem sicher, dass du keine Browser-Plugins hast, die Inhalt sperren könnten'
    +' (z.B. Werbungs-Blocker); falls du solche Plugins hast, müssen sie für diese App deaktiviert werden.'],
  'projects': ['Projects', 'Projekte'],
  'no-project-open': ['No project open', 'Kein Projekt geöffnet'],
  'open-project': ['Open Project', 'Projekt Öffnen'],
  'no-projects': ['No projects', 'Keine Projekte'],
  'open': ['Open', 'Öffnen'],
  'new-project': ['New Project', 'Neues Projekt'],
  'project-id': ['Project ID', 'Projekt-ID'],
  'create': ['Create', 'Erstellen'],
  'valid-ident-explain': ['Valid identifiers must begin with a letter or underscore (_) and contain only letters,'
    +' numbers, dashes (-), and underscores (_).', 'Gültige Identifier müssen mit einem Buchstaben oder Unterstrich (_)'
    +' beginnen und dürfen nur Buchstaben, Zahlen, Bindestriche (-) und Unterstriche (_) enthalten.'],
  //'': ['', ''],
}

// https://fnando.github.io/i18n/
export const i18n = new I18n({
  'en-US': Object.fromEntries( Array.from(Object.entries(translations)).map(([k,v]) => [k, v[0]]) ),
  'de-DE': Object.fromEntries( Array.from(Object.entries(translations)).map(([k,v]) => [k, v[1]]) ),
}, { defaultLocale: 'en-US', missingBehavior: 'error', locale:
  navigator.language.toLowerCase()==='de' || navigator.language.toLowerCase().startsWith('de-')?'de-DE':'en-US' })
