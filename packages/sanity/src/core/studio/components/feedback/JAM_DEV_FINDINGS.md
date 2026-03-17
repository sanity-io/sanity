# Jam.dev Integration Findings

## Summary

After prototyping and testing, integrating Jam.dev as the feedback mechanism inside Sanity Studio presents several UX and technical issues that make it unsuitable in its current form. This document captures the key findings.

## Background

The goal was to embed a feedback flow directly in the Studio UI, allowing users to:

1. Describe their feedback in a text field

2. Optionally consent to being contacted

3. Optionally attach a screenshot or screen recording

4. Submit everything — including metadata like workspace, dataset, project ID, reporter email — to a central place for review

Two Jam integrations were explored:

- **\*Recording Links\*\*** (`@jam.dev/recording-links` SDK) — opens an in-page recorder overlay via `Recorder.open()`
- **\*Recorder link URLs\*\*** (`window.open('https://recorder.jam.dev/...')`) — opens the Jam recorder in a new browser tab

Both approaches were tested alongside Jam's site scripts (`recorder.js`, `capture.js`) and the `@jam.dev/sdk` for attaching custom metadata.

## Issues Found

[Screen Recording 2026-03-17 at 09.21.12.mov](attachment:d3be7642-023b-4ebe-831c-3a3345fbc4ea:Screen_Recording_2026-03-17_at_09.21.12.mov)

### 1. Recording is mandatory — no text-only submission path

Jam does not provide an API or SDK method to submit a report with only text and metadata. Every submission path (`Recorder.open()`, recorder link URL, browser extension) requires the user to go through a screen recording flow. There is no `sendJam()` or equivalent function that accepts properties and creates a report programmatically.

This is a fundamental mismatch with our requirements. Many users will want to submit quick text feedback without recording their screen. Forcing them into a recording flow creates unnecessary friction and will likely reduce submission rates.

### 2. In-page overlay must stay on the same tab to preserve metadata

Custom metadata (description, consent, workspace context) is set on `window.__jam__.exports.metadata`, which is scoped to the current page's JavaScript context. The in-page overlay (`Recorder.open()`) works on the same tab and can read this metadata. However, if the recorder opens in a new tab (via `window.open()`), the new tab has no access to the original page's `window.__jam__` object due to cross-origin restrictions (the recorder lives on `recorder.jam.dev`).

This means metadata — including the user's description and contact consent — is lost when using the new-tab approach. The only way to retain it is the in-page overlay, which introduces the problems described below.

### 3. The in-page overlay completely covers the Studio

When `Recorder.open()` is called, the Jam overlay takes over the entire viewport. The Studio UI is fully hidden behind the overlay. There is no visual indication that the Studio is still there or how to get back to it. While pressing Escape dismisses the overlay, this is not communicated anywhere in the Jam UI.

For users unfamiliar with Jam, this creates a disorienting experience where the tool they were using has seemingly disappeared.

### 4. The overlay looks and feels like a separate product

The Jam recorder overlay has its own branding, color scheme, and UI patterns that are visually disconnected from the Sanity Studio. Users clicking a "Share feedback" button inside the Studio are suddenly presented with a completely different interface (green accent colors, "Get ready to record" messaging, Jam branding). This creates a jarring transition that may erode trust, especially for users who are not familiar with Jam.dev.

### 5. The recording prompt discourages feedback from privacy-conscious users

The first screen the user sees after clicking submit is "Get ready to record" with options for "Screen + voice" and "Screen only". Users who simply wanted to leave written feedback — and especially those who are uncomfortable with screen recording — may abandon the process entirely at this point.

There is no option to skip recording and proceed to a text-only submission within the Jam overlay.

### 6. Post-submission navigation is confusing

After completing a recording and submitting through the Jam overlay, the final screen prompts the user to "close the tab." Since the overlay is not actually a separate tab (it is rendered on top of the Studio in the same tab), this message is misleading. Users may close the actual browser tab, losing their Studio session. Those who do not close the tab are left on a Jam confirmation screen with no clear path back to the Studio.

## What Works

- **\*Metadata attachment\*\***: The `jam.metadata()` callback and `window.__jam__.exports.metadata` mechanism correctly attaches custom data (workspace, dataset, project ID, reporter, description, contact consent) to Jam recordings when the site scripts are loaded and the recording happens on the same page.
- **\*Console log capture\*\***: Jam's `capture.js` script successfully captures `console.log` output from the Studio page, which appears in the Jam report.
- **\*Recording quality\*\***: The actual screen recordings produced by Jam are high quality and include useful debugging context (console logs, network requests, device info).

## Conclusion

Jam.dev is a capable screen recording and bug reporting tool, but its SDK and recording flow are designed for a different use case — external bug reporting where the recorder is the primary interface. Embedding it as an integrated feedback mechanism inside a product like Sanity Studio exposes fundamental UX limitations:

- No text-only submission path
- Mandatory recording prompt
- Full-page overlay that hides the host application
- Confusing post-submission navigation
- Visual disconnection from the host product

These issues would likely result in low feedback submission rates and a frustrating experience for Studio users.
