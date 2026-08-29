# Laufbursche Egret unlock

A static web page that talks to Egret e-scooters over Web Bluetooth. Let the page auto-detect your
scooter or pick the model yourself, and it uses the matching BLE protocol for it. Depending on the
model it sets the maximum speed, switches the ride mode, locks and unlocks the vehicle and changes
display settings, straight from the browser. Nothing to install: no app store, no signing, no
developer account. It runs in **Bluefy** on iOS and in **Chrome** or **Edge** on Android or desktop.

> **This is a feasibility study.** It exists to show what Egret's Bluetooth protocol makes
> possible, not to be a finished product. The protocol was reconstructed from the official app
> (de.walberg.egret 2.0.60) and is documented byte for byte. Error-free operation is not promised and
> there is no warranty of any kind. Whatever you do with it, you do at your own risk.

**Open the web app: [laufbursche42.github.io/eg-unlock](https://laufbursche42.github.io/eg-unlock/)**

Or run it yourself, no build step and no dependencies: clone the repo and serve the folder over a
local HTTP server. Opening `index.html` directly as a `file://` URL will not work, the page fetches
its own documents and browsers block that over `file://`.

```
git clone https://github.com/Laufbursche42/eg-unlock.git
cd eg-unlock
python -m http.server 8000
```

Any static server works. With Node installed, this does the same job:

```
npx serve .
```

Then open the printed address in a browser that supports Web Bluetooth.

**Guide: [Deutsch](GUIDE.de.md) | [English](GUIDE.en.md)** covers everything step by step, from
picking the model to the first send.

## Auto-detect or pick your model

The BLE protocol differs per model, so the page needs to know which scooter it is talking to. The
default dropdown option, **Auto detect**, classifies the scooter by its advertised name (modern
models advertise as `EGRET ...`, the older ones as `EY...` or `YD...`) and then selects the transport
and command set. You can also pick your model from the list.

Every model the app knows is covered:

- Modern family: **Egret X**, **X Core**, **X Prime**, **X Ultra**, **Pro**, **Pro FX**, **One**,
  **GT**, **GTs**, **GTc**, **Unit**
- EY family: **EY1**, **EY2**, **EY2p**, **EY3**, **EY6**, **EY6p**, **EY7**, **EYS**

Not every model can be made faster over Bluetooth, and the page reflects that:

- The modern family uses the `SetSpeedLimit` command (up to 45 km/h). This command is not model-gated
  in the app code, so it is offered for all modern models. Whether the controller firmware actually
  rides a value above the approved limit is only shown by a test on the device.
- On the EY family the speed lever is the **X-mode**, and the app code has it only for **EY1, EY2 and
  EY2p**. EY3, EY6, EY6p, EY7 and EYS have gears only, so their tunability is left open and marked as
  such.
- The **Unit** is a modern type in the code but its serial class is not listed in the connection
  classifier, so it stays in with a note until someone confirms it on a real device.

The page hides the controls a model does not support and shows only what its code path exposes.

## What it does

- **Auto-detect the scooter** by its advertised name, or pick the model from the list.
- **Set the maximum speed** on the modern family: `SetSpeedLimit` (opcode `08`) on characteristic
  `BCCAE7E1`, the value being the km/h byte, preceded by `SetSpeedLimitEnabled` (opcode `07`). The
  Unlock/Lock toggle switches between an open value and the legal eKFV value. Not available on the EY
  family, which uses X-mode or gear (function `05`) instead.
- **Switch the ride mode** between Off, Eco, Tour and Sport (operation opcode `06`).
- **Lock and unlock the vehicle**. This is the anti-theft immobilizer, not the speed (operation
  opcode `02`; EY uses its own commands).
- **More per-model settings** where the model exposes them: headlight on/off (operation opcode `03`),
  unit km/h or mph (settings opcode `09`), display brightness (settings opcode `02`), automatic
  headlights on the **GT** only (settings opcode `13`), and reset trip or total kilometers (operation
  opcodes `09` and `11`).
- **Read the telemetry** the scooter sends back (speed, battery, ride mode, lock, light, range,
  temperature) and keep the raw notifications in an on-screen diagnostic log as plain hex, marked TX
  and RX.

Deliberately left out are the risky admin commands (writing the serial number, activation), which
could render a device unusable.

## Encryption and pairing

There is no cryptographic authentication anywhere in the protocol, and the tool needs none:

- **Modern family:** the command is plain `[opcode][payload]` written to the vendor characteristic.
  No CRC, no encryption. Pairing is the normal operating-system Bluetooth bond.
- **EY family:** the payload is scrambled with a position XOR (`byte i XOR (i+10)`) and secured with
  CRC16-CCITT. The pairing uses a fixed 14-byte code and the fixed PIN `0000`. Nothing is derived from
  the MAC or serial, so there is no device-individual key.

The EY self-test (CRC16 and scramble against the original app frames) runs on load and is written to
the diagnostic log, next to the environment header (build, user agent, platform, Web Bluetooth, the
selected model and its transport).

## Browser support

- **iOS:** the **Bluefy** browser. Safari and every other iOS browser run on the Safari engine, which
  has no Web Bluetooth at all.
- **Android or desktop:** **Chrome** or **Edge** (any Chromium browser). Web Bluetooth is built in.

There is no OTA firmware flashing here. The Egret app can flash firmware over Bluetooth, but that is
out of scope for this tool.

## Project structure

```
index.html                - the single page: cards, dialogs, the model dropdown
app.js                    - all logic: the model registry, frame builders, EY CRC16 plus scramble,
                            connect, decode, UI and the diagnostic log
i18n.js                   - the German and English string table
styles.css                - theme and layout
GUIDE.de.md, GUIDE.en.md  - the step-by-step guide
favicon.svg, favicon-*.png - the icon
```

The full byte-level protocol reference (services, characteristics, packet formats, telemetry) lives
in the separate analysis document of the neighboring reverse-engineering project.

## How it works

- The user picks a model or lets the page auto-detect it. `autoDetect` in `app.js` maps an advertised
  device name to a model. The `MODELS` registry maps each model to a family (`modern` or `ey`), its
  speed lever and the functions it exposes, derived from the app code (for example X-mode only for
  EY1/EY2/EY2p, automatic headlights only for the GT).
- Modern commands are built as `[opcode][payload]` and written to the vendor characteristics
  (Operation `7D971CD1`, Settings `BCCAE7E1`). Telemetry is read and subscribed on the status
  characteristics and decoded big-endian.
- EY frames are built as `5A addr func func len data... crcHi crcLo`, CRC16-CCITT over the header and
  data, then scrambled, and written to the Nordic UART write characteristic `6E400002`. Notifications
  arrive in clear text on `6E400003`.

## Development

No build step and no dependencies. Edit the files and reload the page. Serve locally, Web Bluetooth
needs `https` or `localhost`:

```
python -m http.server 8000
```

The version lives in one place: bump `VER` in `app.js` and set the matching `?v=VER` on the script
and style tags in `index.html`. New user-facing strings go into both languages in `i18n.js`.

## Reporting

Found a problem or want to confirm what works on a real scooter? Open a
[GitHub issue](https://github.com/Laufbursche42/eg-unlock/issues). The copy button under the log
gives you the full diagnostic transcript to paste in.

## Legal

Raising the maximum speed lifts the factory limit. The operating permit (Betriebserlaubnis, ABE) is
then void and riding the scooter in public traffic is no longer allowed. Use it on your own vehicle
only. Everything you do with this page is at your own risk.

## License

PolyForm Noncommercial 1.0.0 with two additional terms, in full in [LICENSE.md](LICENSE.md).

## Privacy

Nothing leaves your device but the page load itself. The details are in [PRIVACY.md](PRIVACY.md).

## Trademarks

An independent project, not affiliated with Egret or Walberg. "Egret" and the model names are
trademarks of their respective owners and are used here only to say which scooters this page works
with. See [TRADEMARKS.md](TRADEMARKS.md).
