IGB-FUCHS Änderungshistorie
===========================

v0.2.0-beta - *noch nicht released*
------------------------

- In Messstellen sind die Koordinaten jetzt in einem "Dropdown" versteckt und nur
  die Knöpfe "Standort" (aktuellen Standort verwenden) und "Karte" (auf Karte zeigen)
  werden standardmäßig angezeigt. Dies wurde geändert weil Messstellen meist im
  Feld ausgefüllt werden und es daher weniger wahrscheinlich ist, dass Koordinaten
  von Hand eingetippt werden.
- Auf der Hauptseite wurde der Reiter "Messprozeduren (Protokoll-Vorlagen)" (engl. "Sampling
  Procedures (Log Templates)") umbenannt in "Vorlagen (Prozeduren)" ("Templates (Procedures)"),
  da der Name zu ähnlich zu "Messprotokolle" ("Sampling Logs") war.
- Da die Anfangs- und End-Zeiten von Protokollen und Messstellen bei Nutzung einer
  Vorlage meistens vollständig automatisch gesetzt werden können, wurden die Eingabefelder
  in einem Dropdown versteckt.
- Im Hilfetext des Messung-Zeitstempels wird nun die Zeitzone angezeigt.
- Wenn man ein Messprotokoll öffnet, bei dem alle Checklist-Aufgaben erledigt sind,
  wird die Checkliste erst nach einem Klick auf den entsprechenden Link angezeigt.
- Interne Änderung: die `id` Attribute in den JSON-Daten wird nun ein wenig strikter validiert.
  Dies wird nur Benutzer betreffen, die diese Attribute in den JSON Dateien von Hand geändert
  haben und dabei nun ungültige Zeichen (z.B. Leerzeichen) eingefügt haben.
- Es existiert nun eine erste Testversion eines sog. "JSON Schema", welches das Datenformat
  von IGB-FUCHS JSON Dateien Programmiersprachen-unabhängig definiert.

v0.1.0-beta - 2025-05-22
------------------------

- In CSV-Dateien wurden die Spalten `Date_DMY` und `Time_UTC` durch die Spalten
  `LocalDate` und `LocalTime` in Ortszeit ersetzt. Zeitzone der Ortszeit ist die
  des exportierenden Geräts.
- Die App wird nun automatisierten Tests unterzogen und das Speicherformat ist in den
  letzten Monaten stabil geblieben, weswegen nun von einer Alpha-Testversion
  zum Betatest übergegangen werden kann. Alle Meldungen wurden entsprechend aktualisiert.

v0.0.7-alpha - 2025-03-10
-------------------------

- Ein "Speichern & Nächste Messstelle" / "... Probe" Knopf wird nun angezeigt,
  um mit weniger Klicks direkt zur nächsten Messstelle bzw. Probe springen zu können.
- Der CSV-Export wurde in mehr Spalten aufgeteilt.
- Verschiedene Datentypen werden nun durch dazugehörige Symbole und Farben gekennzeichnet,
  und die Anzeige der aktuellen Seitenüberschrift wurde verbessert.
- Die Farbe des Knopfs "Speichern & Schließen" spiegelt jetzt in Echtzeit wieder, ob es
  Warnungen oder Fehler in der Eingabemaske gibt (zuvor passierte dies erst beim Klicken).
- Auf der Hauptseite sind Messprotokolle nun etwas mehr hervorgehoben.
- Bei der Auswahl einer Vorlage kann nun ein Eintrag mit Doppelklick ausgewählt werden.
- Zuvor wurde eine fehlende End-Zeit zu häufig als Fehler / Warnung gemeldet.

v0.0.6-alpha - 2025-01-27
-------------------------

- Beim Öffnen eines Objekts wird zum "nächsten relevanten" Eingabefeld gescrollt,
  anstatt wie vorher immer zum Anfang der Seite.
- Große Eingabefelder können durch einen neuen Knopf vergrößert und verkleinert werden.
  Bei neuen Objekten sind sie normalerweise anfangs ausgeklappt, ansonsten eingeklappt.
- Dateinamen beim Export beginnen jetzt mit dem Protokoll/Prozedur-Namen anstatt mit `fuchs`,
  damit bei abgekürzten Dateinamen die Dateien einfacher auseinanderzuhalten sind.
  Außerdem wurde das Format aller Dateinamen vereinheitlicht.
- Die App sollte sich jetzt immer selbst aktualisieren; ein Löschen des Caches
  sollte nicht mehr notwendig sein. (Bloß muss in manchen Fällen die Webseite
  zweimal neu geladen werden, um die neuste Version zu laden; auf manchen Handys
  ggf. mehrfach neu geladen und die App zwischendurch geschlossen werden.
  Dies lässt sich aufgrund der Offline-Funktionalität leider nicht vermeiden,
  müsste aber bei jeder neuen Version jeweils nur einmal notwendig sein.)

v0.0.5-alpha - 2024-12-19
-------------------------

- Beginn der Aufzeichnung der Änderungshistorie
