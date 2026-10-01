# Privacy Policy

This web application collects nothing for itself: no analytics, no telemetry, no tracking, no ads, no
cookies and no third-party scripts. Nothing goes to the developer. The live/Bluetooth part stays
entirely on your device. There is one exception: the optional firmware tab signs you in with your own
Egret account at Egret (api.my-egret.com), exactly like the original app does. Details below.

## What is processed and where it stays

All of the following stays on your device and is never uploaded:

- The live data of the scooter, read over Bluetooth LE.
- The settings you make (open value, eKFV value, model, ride mode). They are stored locally in the
  browser (localStorage) only.
- The log on screen. It lives only in the open page. Credentials and tokens are always redacted in it
  before anything is stored or shown.

## Network connections

- **Loading the page:** your browser fetches the static files from the host (for example GitHub Pages).
  The host sees your IP address and which file you requested, the usual access logs. Scooter data or
  commands never reach any server.
- **Bluetooth LE to the scooter:** a local radio link, not an internet connection. Commands and the
  scooter replies run only between your browser and the scooter.
- **Firmware tab (only if you use it):** a direct HTTPS connection from your browser to
  api.my-egret.com. See the next section.

## Firmware tab (optional)

This is the only part that talks to a server, and only when you actively use it:

- You sign in with your **own** Egret account by magic link, exactly like the app: enter your e-mail,
  then paste the link from the Egret mail. You never type a password into the page; the app only knows
  the magic link for this account anyway.
- Your e-mail and the token from the magic link and the access token you then receive go **directly and
  only** to Egret (api.my-egret.com, HTTPS), exactly like the original app. None of it goes to the
  developer or to any other server. There is no server of this project.
- The token stays **in memory only** in the open page. It is not stored and is gone on reload or sign
  out.
- The tab only **downloads** firmware. It does not flash anything to the scooter, so this tab poses no
  risk to the device.

## No server of this project

There is no account and no server of this project that receives your data. The firmware tab talks to
Egret's backend using your own account, not to a server of this project. For comparison, the original
Egret app additionally uses Sentry and Matomo. This application does not.

## Contact

For privacy questions contact the author (Laufbursche) on GitHub: https://github.com/Laufbursche42
