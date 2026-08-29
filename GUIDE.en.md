# Guide

This page talks to your Egret scooter directly over Web Bluetooth. It implements the protocol proven
from the official Egret app. Nothing leaves your device, there is no server and no tracker.

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
value. Under the hood the page sends `07 01` (limit active) followed by `08 <km/h>`.

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

## Legal note

Raising the top speed removes the throttle limit. The type approval becomes void, riding on public
roads is then not allowed and insurance cover lapses. Everything is only for your own device on private
ground and at your own risk.
