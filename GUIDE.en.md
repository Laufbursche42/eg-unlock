# Guide

This page talks to your Egret scooter directly over Web Bluetooth. It implements the protocol proven
from the official Egret app. The Bluetooth part never leaves your device, there is no server of this
project and no tracker. Only the optional firmware tab talks to your Egret account at api.my-egret.com -
more on that below.

> **Important for error reports:** switch on the **Diagnostic log** at the bottom of the page *before* you connect to the scooter. Only then is the full connection handshake captured - and those are exactly the lines we need in a [ticket](https://github.com/Laufbursche42/Laufbursche42/issues) to reproduce a problem.

## Requirements

- **Android or desktop:** Chrome or Edge.
- **iPhone / iPad:** the Bluefy app (Safari has no Web Bluetooth).
- The scooter is on and in range.
- The first time, the system asks to pair. Modern models use the normal Bluetooth dialog, some EY
  models need no pairing at all.

## Step by step

1. **Pick the model.** In the Model field either let it auto detect or choose your model. Only the
   functions your model supports (per the app code) are then shown.
2. **Connect.** Tap Connect and pick your scooter in the browser dialog.
3. **Check live values.** After connecting the tiles fill with speed, battery, ride mode and more. Not
   every model provides every field.
4. **Set the speed.** See below.

## Speed and the eKFV limit

On the modern models (X, GT, PRO, ONE, UNIT and so on) you enter two values:

- **Open (km/h):** the value you want when unlocked (for example 45).
- **eKFV (km/h):** the legal value (default 20).

The button toggles between them. **Unlock** writes the open value as the top speed, **Lock** the eKFV
value. Under the hood the page sends `08 <km/h>` to the settings characteristic. The app does not send
the once-assumed opcode `07`; it is dead code.

EY models have no km/h command. There the lever is the **X-mode** or the gear. X-mode is only present
on EY1, EY2 and EY2p.

## Being honest

The page sends the command. Whether your scooter **actually rides** the higher value is decided by the
controller firmware, not the app. Two cases are possible:

- The firmware takes the value -> the scooter goes faster.
- The firmware hard-caps at the approved limit -> the command has no effect and only a change to the
  controller firmware would help.

Which case applies to your model is only shown by the test on the device. Set 20 km/h first and check
the display, then the open value. If the limit moves along, your device is tunable.

## More settings

Depending on the model you also get: ride mode, display brightness, automatic headlights (GT only),
headlight on/off, unit km/h or mph, reset kilometers and the immobilizer. Only what your model supports
per the code is shown.

## Downloading firmware

The firmware tab downloads your scooter's firmware as a `.bin` into the phone's Downloads folder. For
that you sign in with your **own** Egret account, by magic link, exactly like the official app. There is
no password, the app only knows the magic link for this account.

How to do it:

1. **Enter your e-mail** and tap *Request magic link*.
2. **Open the mail from Egret** and paste the link (or the token from it) into the field.
3. Tap *Sign in*. Model, version as well as target unit then appear.
4. **Look for firmware** (list, or a targeted check per unit) and on a hit tap *Download*. The `.bin`
   lands in the Downloads folder.

What happens behind it: `POST auth/magic` requests the mail, `GET auth/magic/<token>` signs you in, then
the page queries `/firmware/...` with your token. All of this runs **directly** between your browser and
api.my-egret.com, exactly like the app. Nothing goes to the developer, there is no server of this
project. The token stays in memory only and is gone on sign out. Credentials and token are always
redacted in the log.

Honest note: the tab only downloads, it does not flash anything to the scooter. The login, verify as
well as query path is proven from the app code. What is not firmly documented is whether the actual
`.bin` host allows the download directly in the browser. If the direct download fails, the page opens
the file as a link and the browser saves it through the normal download menu.

## Legal note

Raising the top speed removes the throttle limit. The type approval becomes void, riding on public
roads is then not allowed and insurance cover lapses. Everything is only for your own device on private
ground and at your own risk.

## Contribute
Want to find out if and how tuning works on your scooter? Test this tool on your own vehicle and open a ticket on [GitHub](https://github.com/Laufbursche42/Laufbursche42/issues) - with your model and what worked (or did not). That way we figure out together what is possible on which model.
