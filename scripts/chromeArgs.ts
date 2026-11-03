/**
 * The Chrome command line built by `launchChrome.ts`, as pure functions so its invariants are
 * unit-tested (see `chromeArgs.test.ts`). Passthrough arguments (`-- <extra chrome args>`) must
 * not be able to change the switches the launcher relies on:
 *
 * - by name: `checkPassthroughArgs` rejects any form of a managed switch up front;
 * - by position: Chromium keeps the last value of a repeated switch, so `buildChromeArgs` puts
 *   the passthrough arguments first and the enforced switches after them.
 */

/**
 * Switches the launcher owns, with the hint shown when a passthrough argument sets one.
 *
 * `--remote-debugging-address` widened from 127.0.0.1 exposes the signed-in session's DevTools
 * endpoint beyond loopback; `--remote-debugging-port` / `--remote-debugging-pipe` make startup
 * poll (and reuse detection key on) the wrong endpoint; `--user-data-dir` decides which running
 * Chrome a launch hands over to; `--headless` is the launcher's own flag.
 */
const MANAGED_SWITCHES: ReadonlyMap<string, string> = new Map([
  ['remote-debugging-address', 'the launcher binds it to 127.0.0.1'],
  ['remote-debugging-port', "use the launcher's own --port=<port> flag instead"],
  ['remote-debugging-pipe', 'the launcher talks to Chrome over its debugging port'],
  ['user-data-dir', 'the launcher manages its own profile'],
  ['headless', "use the launcher's own --headless flag (before --) instead"],
])

/**
 * Chromium reads switches as `--name`, `-name` (and `/name` on Windows), optionally `=value`, and
 * lowercases names on Windows. Values are never space-separated. A bare `--` ends switch parsing.
 */
const SWITCH = /^(?:--|-|\/)([^=\-/][^=]*)(?:=|$)/

/** The switch name an argument sets, lowercased, or `undefined` for positional arguments. */
export function switchName(arg: string): string | undefined {
  return SWITCH.exec(arg)?.[1].toLowerCase()
}

/** Rejects passthrough arguments that would set a managed switch or end switch parsing. */
export function checkPassthroughArgs(args: readonly string[]): void {
  for (const arg of args) {
    if (arg === '--') {
      throw new Error(
        'Invalid chrome argument "--": Chromium stops reading switches there, so the ' +
          "launcher's own switches after it would be taken for urls",
      )
    }
    const name = switchName(arg)
    const hint = name === undefined ? undefined : MANAGED_SWITCHES.get(name)
    if (hint !== undefined) {
      throw new Error(`Chrome switch --${name} cannot be passed through: ${hint}`)
    }
  }
}

export interface ChromeArgsOptions {
  port: number
  userDataDir: string
  headless: boolean
  /** `--no-sandbox`, for a Chrome that would otherwise refuse to run its sandbox as root. */
  noSandbox: boolean
  /** The arguments after `--`, already vetted by `checkPassthroughArgs`. */
  passthrough: readonly string[]
}

/**
 * The page Chrome starts on. The studio url is opened later through the debugging endpoint,
 * once that endpoint has been authenticated as this Chrome's, so that neither the token nor the
 * one-shot redirect leading to it ever appears in Chrome's argv (`/proc/<pid>/cmdline` is
 * readable by every local process for the browser's lifetime).
 */
const INITIAL_PAGE = 'about:blank'

/** The argv for Chrome. Passthrough first, then the enforced switches, then the blank page. */
export function buildChromeArgs(options: ChromeArgsOptions): string[] {
  return [
    ...options.passthrough,
    `--remote-debugging-port=${options.port}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${options.userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    ...(options.headless ? ['--headless=new'] : []),
    ...(options.noSandbox ? ['--no-sandbox'] : []),
    INITIAL_PAGE,
  ]
}
