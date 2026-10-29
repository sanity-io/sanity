/**
 * Launches Chrome with its remote debugging (Chrome DevTools Protocol) port open and loads a
 * studio in it, so `chrome-devtools-mcp` can attach with `--browserUrl=http://127.0.0.1:<port>`
 * and expose the React DevTools tools registered by `react-devtools-cdt-mcp`
 * (`ENABLE_REACT_DEVTOOLS_MCP=true`, see dev/test-studio/sanity.cli.ts).
 *
 * Usage: `pnpm react-devtools-mcp:chrome [url] [--headless] [--port=9222] [--inject-token] [-- <extra chrome args>]`
 *
 * - `url` defaults to the test studio's `/test` workspace. When `STUDIO_AUTH_TOKEN` is set and
 *   the url has no hash, the studio is opened with `#token=<token>` so it signs in on load (the
 *   studio consumes the token and strips it from the address bar). Neither the token nor the
 *   url leading to it ever appears in Chrome's argv, in Chrome's environment or in this script's
 *   output: Chrome is started on `about:blank` with an allowlisted environment (see
 *   `./chromeEnvironment.ts`) instead of the caller's, and once its debugging endpoint has been
 *   authenticated as this Chrome's it is navigated, through that endpoint, to a one-shot redirect
 *   served from an ephemeral loopback server, which forwards it to the tokenized url.
 * - The token is only injected automatically for loopback origins (`localhost`, `127.0.0.1`,
 *   `[::1]`), where a local studio runs. Any other origin would receive the production token
 *   through `location.hash`, so an `https:` origin requires the explicit `--inject-token` flag
 *   and a plaintext `http:` origin the separately named `--inject-token-insecure-http`.
 * - `CHROME_PATH` overrides the Chrome executable that is used.
 * - Extra Chrome arguments go after `--`. They cannot set the switches the launcher relies on
 *   (`--remote-debugging-address`, `--remote-debugging-port`, `--remote-debugging-pipe`,
 *   `--user-data-dir`, `--headless`; see `./chromeArgs.ts`), and they are placed before the
 *   launcher's own switches, which Chromium therefore keeps when a switch is repeated.
 * - The profile lives in `node_modules/.cache/react-devtools-mcp/chrome-profile` and is reused
 *   across runs. Chrome stays open after this script exits; stop it with `kill <pid>`.
 * - A browser already listening on the port gets the url as a new tab, but only when it is the
 *   Chrome this launcher started: Chrome's stderr is captured to
 *   `node_modules/.cache/react-devtools-mcp/chrome-stderr.log`, the browser target it announces
 *   there is recorded with its pid in `launcher.json` next to it once the launch succeeded, and a
 *   later run reuses the listener only while that process is alive and the listener advertises
 *   that target in `/json/version` (see `./devtoolsEndpoint.ts`). Any other listener is refused,
 *   since handing it the redirect url would hand it the token.
 *
 * The implementation lives in `./chromeLauncher.ts`, which is import-safe so its orchestration
 * (one-shot redirect, listener authentication before the redirect exists, cleanup) is covered by
 * `chromeLauncher.test.ts`; this file only runs it.
 */
import process from 'node:process'

import {run} from './chromeLauncher'

run(process.argv.slice(2), process.env).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
