# Changelog

Notable changes to Laufbursche Egret unlock, newest first. The version is the `BUILD` value in
`app.js`, mirrored in the `?v=` cache-buster on the script and style tags.

## v15

- New **Firmware** tab: sign in with your own Egret account by magic link and download your scooter's
  firmware (`.bin`) to the phone's Downloads folder, straight from the browser. It talks directly to
  `api.my-egret.com` over HTTPS, exactly like the official app; there is no password, the app uses the
  magic link only. Flow proven from the app code: `POST auth/magic` to request the link, then
  `GET auth/magic/<token>` to sign in. The access token stays in memory only and is never logged.
- Firmware list and per-unit check (controller, display, bluetooth, bms); the download uses fetch into
  a Blob with a direct-link fallback when the download host blocks CORS.
- Added a debug (diagnostic) log toggle next to the public log, both as checkboxes.
- Secrets are masked at the source: tokens, `Bearer` headers and `token`/`password`/`code`/`secret`
  values are redacted before anything reaches the log buffer, so the screen, a copy and the saved file
  never hold them.
- Honest wording pass: the guide and the privacy policy now say the Bluetooth part stays on the device
  while the firmware tab talks to your Egret account at `api.my-egret.com`. Help text for the firmware
  section added.
- Guide fix: the speed command is only `08 <km/h>`; opcode `07` is dead code and is not sent.
- Noted the `api.my-egret.com` `Access-Control-Allow-Origin: *` finding in the separate security report
  (finding 6), which is what makes the browser-side firmware tab possible.

## up to v14

- Web Bluetooth live control: auto-detect or pick the model, live telemetry, the speed and eKFV limit,
  ride mode, brightness, headlights, unit, odometer reset and the anti-theft lock, each per the model's
  capabilities. BLE only; nothing left the device.
