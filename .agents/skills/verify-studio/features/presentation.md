# Presentation

Load the Presentation tool with its preview iframe, check that visual editing connects, and
switch the preview viewport.

## Setup

- Target `test` for the local preview iframe: `start-studio.sh test` also starts
  `dev/preview-iframe` on port 3334, and the `/test` workspace previews `http://localhost:3334`.
  The `e2e` studio previews the deployed `https://test-studio-preview-iframe.sanity.dev`, so a
  change to `dev/preview-iframe` itself only shows on `test`.
- `login.sh test /test/presentation`. Studio may redirect to the last document opened there.
- To exercise failure states (connection timeout, load timeout), point the preview at a throwaway
  local server with `?preview=` as described under "Simulating Presentation preview failure
  states" in `AGENTS.md`.

## Steps

```bash
S=.agents/skills/verify-studio/scripts; OUT=/opt/cursor/artifacts/verify-studio
ROOT='[data-testid="presentation-root"]'
```

1. `$S/wait-for.sh "$ROOT iframe"` and read the iframe's `src`.
2. Wait for the overlays: the preview is cross-origin, so judge the connection from the studio
   side. Poll `$S/pw.sh --raw eval "document.querySelector('$ROOT').innerText"` until the
   "Documents on this page" panel lists documents (or, with a document open, its form shows),
   then take the screenshot that shows the overlays.
3. `$S/pw.sh click '[data-testid="preview-viewport-toggle"]'`.
4. Click it again.

## Expected

1. The iframe `src` starts with `http://localhost:3334/` (`test`) and carries
   `sanity-preview-perspective`.
2. No "connecting" or caution card covers the preview; the screenshot shows the preview content
   with edit overlays ("Click to edit" on hover).
3. `[data-testid="preview-viewport-toggle"]` has `data-viewport="mobile"` and the URL gains
   `viewport=mobile`; the preview narrows.
4. Back to `data-viewport="desktop"`.

## Evidence

- `06-presentation.png` after step 2, `07-presentation-mobile.png` after step 3; move the pointer
  off the toolbar first (`$S/pw.sh mousemove 5 890`), the toggle's tooltip otherwise covers the
  frame.
- The iframe origin and the `data-viewport` values in the report.
