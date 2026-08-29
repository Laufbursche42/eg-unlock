# Privacy Policy

This web application keeps your data on your device. It collects nothing. There is no sign-in, no
analytics, no telemetry, no tracking, no ads, no cookies and no third-party scripts. Nothing goes to
the developer or to any Egret or Walberg backend.

## What is processed and where it stays

All of the following stays on your device and is never uploaded:

- The live data of the scooter, read over Bluetooth LE.
- The settings you make (open value, eKFV value, model, ride mode). They are stored locally in the
  browser (localStorage) only.
- The log on screen. It lives only in the open page.

## The only network connection

- **Loading the page:** your browser fetches the static files from the host (for example GitHub Pages).
  The host sees your IP address and which file you requested, the usual access logs. Scooter data or
  commands never reach any server.
- **Bluetooth LE to the scooter:** a local radio link, not an internet connection. Commands and the
  scooter replies run only between your browser and the scooter.

## No backend

There is no account and no server of this project that receives your data. For comparison, the original
Egret app signs you in, talks to a backend (api.my-egret.com) and uses Sentry and Matomo. This
application does none of that.

## Contact

For privacy questions contact the author (Laufbursche) on GitHub: https://github.com/Laufbursche42
