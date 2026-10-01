# Anleitung

Diese Seite redet über Web Bluetooth direkt mit deinem Egret-E-Scooter. Sie setzt das Protokoll um,
das aus der offiziellen Egret-App belegt wurde. Der Bluetooth-Teil verlässt dein Gerät nicht, es gibt
keinen Server dieses Projekts und keinen Tracker. Nur der optionale Firmware-Reiter spricht mit deinem
Egret-Konto bei api.my-egret.com - dazu unten mehr.

## Voraussetzungen

- **Android oder Desktop:** Chrome oder Edge.
- **iPhone / iPad:** die App Bluefy (Safari kann kein Web Bluetooth).
- Der Scooter ist an und in Reichweite.
- Beim ersten Verbinden fragt das System nach der Kopplung. Bei modernen Modellen läuft das über den
  normalen Bluetooth-Dialog, bei manchen EY-Modellen ganz ohne Kopplung.

## Schritt für Schritt

1. **Modell wählen.** Oben im Feld Modell entweder Automatisch erkennen lassen oder dein Modell selbst
   auswählen. Danach erscheinen nur die Funktionen, die dein Modell laut App-Code kann.
2. **Verbinden.** Auf Verbinden tippen und im Browser-Dialog deinen Scooter auswählen.
3. **Live-Werte prüfen.** Nach dem Verbinden füllen sich die Kacheln mit Geschwindigkeit, Akku,
   Fahrmodus und mehr. Nicht jedes Modell liefert jedes Feld.
4. **Geschwindigkeit setzen.** Siehe unten.

## Geschwindigkeit und eKFV-Sperre

Bei den modernen Modellen (X, GT, PRO, ONE, UNIT und so weiter) trägst du zwei Werte ein:

- **Offen (km/h):** der Wert, den du zum Entsperren willst (zum Beispiel 45).
- **eKFV (km/h):** der legale Wert (Standard 20).

Der Knopf schaltet zwischen beiden um. **Entsperren** schreibt den offenen Wert als
Höchstgeschwindigkeit, **Sperren** den eKFV-Wert. Technisch sendet die Seite dabei `08 <km/h>` auf die
Settings-Characteristic. Den früher vermuteten Opcode `07` sendet die App nicht, er ist toter Code.

Bei EY-Modellen gibt es keinen km/h-Befehl. Dort ist der Hebel der **X-Mode** beziehungsweise die
Fahrstufe. Der X-Mode ist nur bei EY1, EY2 und EY2p vorhanden.

## Wichtig zur Ehrlichkeit

Die Seite sendet den Befehl. Ob dein Scooter den höheren Wert **wirklich fährt**, entscheidet die
Steuerungs-Firmware im Controller, nicht die App. Zwei Fälle sind möglich:

- Die Firmware übernimmt den Wert -> der Scooter wird schneller.
- Die Firmware deckelt hart auf die zugelassene Grenze -> der Befehl bleibt wirkungslos und es hilft
  nur ein Eingriff an der Controller-Firmware.

Welcher Fall bei deinem Modell gilt, zeigt erst der Test am Gerät. Setze dazu erst 20 km/h und prüfe
die Anzeige, dann den offenen Wert. Springt die Grenze mit, ist dein Gerät tunebar.

## Weitere Einstellungen

Je nach Modell erscheinen zusätzlich: Fahrmodus, Display-Helligkeit, automatische Scheinwerfer (nur
GT), Scheinwerfer an/aus, Einheit km/h oder mph, Kilometer zurücksetzen sowie die Diebstahlsperre
(Wegfahrsperre). Es wird immer nur angezeigt, was dein Modell laut Code unterstützt.

## Firmware herunterladen

Der Firmware-Reiter lädt die Firmware deines E-Scooters als `.bin` in den Downloads-Ordner des Handys.
Dafür meldest du dich mit deinem **eigenen** Egret-Konto an, per Magic-Link, genau wie die offizielle
App. Ein Passwort gibt es nicht, die App kennt für dieses Konto nur den Magic-Link.

So geht es:

1. **E-Mail eingeben** und auf *Magic-Link anfordern* tippen.
2. **Die E-Mail von Egret öffnen** und den Link (oder den Token daraus) in das Feld einfügen.
3. Auf *Anmelden* tippen. Danach erscheinen Modell, Version sowie Ziel-Steuergerät.
4. **Firmware suchen** (Liste oder gezielter Check je Steuergerät) und bei einem Treffer auf
   *Herunterladen* tippen. Die `.bin` landet im Downloads-Ordner.

Was dahinter passiert: `POST auth/magic` fordert die Mail an, `GET auth/magic/<token>` meldet dich an,
danach fragt die Seite `/firmware/...` mit deinem Token ab. All das läuft **direkt** zwischen deinem
Browser und api.my-egret.com, genau wie bei der App. Nichts geht an den Entwickler, es gibt keinen
Server dieses Projekts. Der Token bleibt nur im Arbeitsspeicher und ist mit Abmelden weg. Zugangsdaten
sowie Token werden im Protokoll immer geschwärzt.

Ehrlich dazu: Der Reiter lädt nur herunter, er flasht nichts auf den Scooter. Der Login-, Verify- sowie
Abfrage-Weg ist aus dem App-Code belegt. Nicht sicher dokumentiert ist, ob der eigentliche `.bin`-Host
den Download im Browser direkt erlaubt. Klappt der direkte Download nicht, öffnet die Seite die Datei
als Link und der Browser speichert sie über das normale Download-Menü.

## Rechtlicher Hinweis

Das Anheben der Höchstgeschwindigkeit hebt die Drossel auf. Die ABE erlischt, der Betrieb auf
öffentlichen Wegen ist dann nicht erlaubt und der Versicherungsschutz entfällt. Alles gilt nur für das
eigene Gerät auf privatem Gelände und auf eigenes Risiko.
