# Datenschutzerklärung

Diese Webanwendung sammelt für sich selbst nichts: keine Statistik, keine Telemetrie, keine Verfolgung,
keine Werbung, keine Cookies sowie keine Skripte von Dritten. An den Entwickler geht nichts. Der Live-
beziehungsweise Bluetooth-Teil bleibt vollständig auf deinem Gerät. Eine Ausnahme gibt es: der optionale
Firmware-Reiter meldet dich mit deinem eigenen Egret-Konto bei Egret an (api.my-egret.com), genau wie die
Original-App. Einzelheiten unten.

## Was verarbeitet wird und wo es bleibt

Alles Folgende bleibt auf deinem Gerät und wird nirgendwohin hochgeladen:

- Die Live-Daten des Scooters, über Bluetooth LE gelesen.
- Die Einstellungen, die du triffst (offener Wert, eKFV-Wert, Modell, Fahrmodus). Sie werden nur lokal
  im Browser gespeichert (localStorage).
- Das Protokoll auf dem Bildschirm. Es lebt nur in der offenen Seite. Zugangsdaten sowie Token werden
  darin immer geschwärzt, bevor etwas gespeichert oder angezeigt wird.

## Netzverbindungen

- **Laden der Seite:** Dein Browser holt die statischen Dateien vom Anbieter (zum Beispiel GitHub
  Pages). Der Anbieter sieht dabei deine IP-Adresse sowie welche Datei du abgerufen hast. Das sind die
  üblichen Zugriffsprotokolle. Scooter-Daten oder Kommandos erreichen dabei keinen Server.
- **Bluetooth LE zum Scooter:** eine lokale Funkverbindung. Das ist keine Internetverbindung. Kommandos
  sowie die Antworten des Scooters laufen ausschließlich zwischen deinem Browser und dem Scooter.
- **Firmware-Reiter (nur wenn du ihn nutzt):** direkte HTTPS-Verbindung deines Browsers zu
  api.my-egret.com. Siehe nächster Abschnitt.

## Firmware-Reiter (optional)

Dieser Bereich ist der einzige, der mit einem Server spricht und nur dann, wenn du ihn aktiv benutzt:

- Du meldest dich mit deinem **eigenen** Egret-Konto per Magic-Link an, genau wie die App: E-Mail
  eingeben, dann den Link aus der Egret-Mail einfügen. Ein Passwort gibst du nie in die Seite ein, die
  App kennt für dieses Konto ohnehin nur den Magic-Link.
- Die E-Mail sowie der Token aus dem Magic-Link und der danach erhaltene Zugriffs-Token gehen **direkt
  und nur** an Egret (api.my-egret.com, HTTPS), genau wie bei der Original-App. Nichts davon geht an den
  Entwickler oder an einen anderen Server. Es gibt keinen Server dieses Projekts.
- Der Token bleibt **nur im Arbeitsspeicher** der offenen Seite. Er wird nicht gespeichert und ist beim
  Neuladen oder Abmelden weg.
- Der Reiter lädt die Firmware nur **herunter**. Er flasht nichts auf den Scooter, es besteht also kein
  Risiko fürs Gerät durch diesen Reiter.

## Kein Server dieses Projekts

Es gibt kein Konto sowie keinen Server dieses Projekts, der deine Daten annimmt. Der Firmware-Reiter
spricht mit dem Backend von Egret über dein eigenes Konto, nicht mit einem Server dieses Projekts. Zum
Vergleich: die Original-App von Egret nutzt zusätzlich Sentry sowie Matomo. Diese Anwendung tut das
nicht.

## Kontakt

Bei Fragen zum Datenschutz wende dich an den Autor (Laufbursche) auf GitHub:
https://github.com/Laufbursche42
