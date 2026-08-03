---
source: stories/presentation/PreviewChrome.stories.tsx
title: 'Overlays & Navigation/Preview Chrome'
blocks: 6
roundtrip: true
sourceHash: 9ca0e3da3126779c
---

<!-- @component -->

The error card is the interesting one of these three pieces, because of a button it only sometimes shows: a preview that fails to connect gets one way back in, but a preview that connected and failed a safety check gets a second, riskier one, because the tool admits its own check might be wrong.

|          |                                     |
| -------- | ----------------------------------- |
| Source   | `packages/sanity/src/presentation/` |
| Tier     | CHROME                              |
| Patterns | `error-messages`                    |

Three isolated pieces of the Presentation tool: the error state that replaces a preview that will not load, the QR code for opening that preview on a phone, and the button that opens it in a new tab. The Presentation tool itself is out of scope for a storybook: `Preview` needs a live iframe and a comlink connection to a running front end. These three are the parts that do not.

> **Why it matters:** a preview that fails to connect gets Retry; a preview that connected but failed a check gets Retry and Continue anyway, the second in critical tone. That second button is an admission that the tool's own safety check can be wrong, a preview URL might be perfectly fine and simply fail a CORS probe, and rather than trap the person behind a check it cannot fully trust, it lets them past while marking the exit as risky. Very few error screens in this codebase offer a way through. This one does, and tones it accordingly.

<!-- @story ErrorNoActions -->

The bare form. A title, the underlying message, and nothing to do about it - the shape used when the failure is in configuration rather than in the connection.

<!-- @story ErrorWithRetry -->

A transient failure: the preview did not respond. One ghost-toned Retry, because retrying is both safe and likely to work.

<!-- @story ErrorWithBothActions -->

Both buttons, and the tone difference is the message. Retry is neutral; **Continue anyway** is critical, because the check that failed exists for a reason and going past it may not work.

The layout switches with the number of actions: two buttons go inline in a row, one sits alone in a `Box`. Small thing, but it means a single action never looks like half of a pair with the other one missing.

<!-- @story QRCode -->

A fork of `qrcode.react`, vendored into the studio and rendered as SVG rather than canvas. SVG matters here: the code scales to any size without re-encoding, stays crisp on a high-density display, and inherits the theme rather than needing a light background painted under it.

It exists so an editor can point a phone at their screen and open the preview on a real device, which is the one thing a desktop preview pane cannot show them.

<!-- @story QRCodeErrorLevels -->

The same URL at four error-correction levels. Higher correction survives more damage - a scuffed screen, a bad camera angle - at the cost of a denser code. Look at the module count climbing from L to H.

For a code being scanned off a monitor a metre away, the low levels are usually enough; the reason to know the control exists is that a denser code is harder to scan at small sizes, so raising correction can make scanning _worse_ rather than better.
