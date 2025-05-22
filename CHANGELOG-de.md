IGB-FUCHS Änderungshistorie
===========================

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
