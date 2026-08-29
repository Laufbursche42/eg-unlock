# Datenschutzerklärung

Diese Webanwendung hält deine Daten auf deinem Gerät. Sie sammelt nichts. Es gibt keine Anmeldung,
keine Statistik, keine Telemetrie, keine Verfolgung, keine Werbung, keine Cookies sowie keine Skripte
von Dritten. Nichts geht an den Entwickler oder an ein Backend von Egret bzw. Walberg.

## Was verarbeitet wird und wo es bleibt

Alles Folgende bleibt auf deinem Gerät und wird nirgendwohin hochgeladen:

- Die Live-Daten des Scooters, über Bluetooth LE gelesen.
- Die Einstellungen, die du triffst (offener Wert, eKFV-Wert, Modell, Fahrmodus). Sie werden nur lokal
  im Browser gespeichert (localStorage).
- Das Protokoll auf dem Bildschirm. Es lebt nur in der offenen Seite.

## Die einzige Netzverbindung

- **Laden der Seite:** Dein Browser holt die statischen Dateien vom Anbieter (zum Beispiel GitHub
  Pages). Der Anbieter sieht dabei deine IP-Adresse sowie welche Datei du abgerufen hast. Das sind die
  üblichen Zugriffsprotokolle. Scooter-Daten oder Kommandos erreichen dabei keinen Server.
- **Bluetooth LE zum Scooter:** eine lokale Funkverbindung. Das ist keine Internetverbindung. Kommandos
  sowie die Antworten des Scooters laufen ausschließlich zwischen deinem Browser und dem Scooter.

## Kein Backend

Es gibt kein Konto sowie keinen Server dieses Projekts, der deine Daten annimmt. Zum Vergleich: die
Original-App von Egret meldet dich an und spricht mit einem Backend (api.my-egret.com) und nutzt Sentry
sowie Matomo. Diese Anwendung tut nichts davon.

## Kontakt

Bei Fragen zum Datenschutz wende dich an den Autor (Laufbursche) auf GitHub:
https://github.com/Laufbursche42
