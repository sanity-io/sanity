import {
  type BrowserContext,
  type Frame,
  type Locator,
  type Page,
  type PlaywrightTestArgs,
  type PlaywrightTestOptions,
  type PlaywrightWorkerArgs,
  type PlaywrightWorkerOptions,
  type TestType,
} from '@playwright/test'

import {
  buildDomPropLeakScannerScript,
  DOM_PROP_LEAK_MARKER,
  type DomPropLeakFinding,
  type DomPropLeakScan,
  type ScannerWindow,
} from './domPropLeaks/scanner'
import {loadDomPropVocabulary} from './domPropLeaks/vocabulary'
import {isForeignDocument, isFromForeignFrame, type PageFrameUrls} from './foreignFrames'

/**
 * Selector that matches any Studio error screen — both the React error
 * boundary screens (`data-testid="studio-error-screen"`) and the pre-React
 * `window.onerror` overlay (`#__sanityError`).
 */
export const STUDIO_ERROR_SELECTOR = '[data-testid="studio-error-screen"], #__sanityError'

const ERROR_SCREEN_MARKER = '__STUDIO_ERROR__'

/**
 * Source of a detected studio error.
 * - `pageerror`: an uncaught exception or promise rejection that its document left unhandled. The
 *   `GlobalErrorHandler` script that `sanity build` and `sanity dev` put in the studio's HTML
 *   handles the uncaught exceptions of the studio's own document (its `window.onerror` returns
 *   `true`), and the studio shows them as an error screen or an "Uncaught error" toast, so from
 *   that document only rejections are page errors.
 * - `error-screen`: a rendered studio error screen (React boundary or pre-React overlay)
 */
export type StudioErrorSource = 'pageerror' | 'error-screen'

/**
 * The react-dom development-build diagnostics that mean a non-DOM prop reached a DOM element
 * (or an attribute is misspelled), plus its style property warnings. Only the development build
 * of react-dom emits them, so they appear when the suite runs against `sanity dev` (the default
 * local `webServer`). The DOM prop leak scanner applies the same prop rules to the production
 * build CI deploys; these messages also cover what it does not see, such as `style` values and
 * elements outside the document. The unit and browser-mode vitest suites carry the same check
 * through `@repo/test-config/vitest/failOnReactDomPropWarnings`; keep the two lists in sync.
 */
export const REACT_DOM_PROP_WARNING =
  /React does not recognize the `\S+` prop on a DOM element|Invalid DOM property `|Invalid value for prop `?\S+`? on <|for a non-boolean attribute `|for the boolean attribute `|Received NaN for the `|Unknown event handler property `|Invalid event handler property `|Invalid ARIA attribute `|Invalid aria props? |Unknown ARIA attribute `|Invalid attribute name: `|Unsupported (?:vendor-prefixed )?style property |is an invalid value for the `\S+` css style property/

/**
 * styled-components' own leak check (a `console.warn`), which also covers all-lowercase unknown
 * props such as `intent` that react-dom renders as attributes without a word. Every `@sanity/ui`
 * primitive bottoms out in a `styled.<tag>`, so this fires for props spread through them too.
 * Development build only, once per prop name per page load.
 */
export const STYLED_COMPONENTS_UNKNOWN_PROP_WARNING =
  /styled-components: it looks like an unknown prop "[^"]+" is being sent through to the DOM/

export interface StudioErrorInfo {
  source: StudioErrorSource
  message: string
}

/**
 * Predicate used by {@link StudioErrorWatcher.expectError} to decide whether an observed error
 * is the one the caller expected. Strings and regexps are matched against
 * `message`; functions receive the full {@link StudioErrorInfo}.
 */
export type StudioErrorMatcher = string | RegExp | ((info: StudioErrorInfo) => boolean)

function matches(matcher: StudioErrorMatcher, info: StudioErrorInfo): boolean {
  if (typeof matcher === 'string') return info.message.includes(matcher)
  if (matcher instanceof RegExp) return matcher.test(info.message)
  return matcher(info)
}

/**
 * Returns a Playwright locator for the Studio error screen.
 * ```ts
 * await expect(studioErrorLocator(page)).toBeVisible()
 * await expect(studioErrorLocator(page)).toHaveAttribute('data-error', /Session not found/)
 * ```
 */
export function studioErrorLocator(page: Page): Locator {
  return page.locator(STUDIO_ERROR_SELECTOR)
}

/**
 * Everything the watcher has seen of props that reached DOM elements although they should not, in
 * the documents that have the origin of their page (see {@link watchForStudioErrors}).
 */
export interface DomPropLeakReport {
  /** Found by the scanner, including in documents that were navigated away from. */
  findings: DomPropLeakFinding[]
  /** react-dom and styled-components development-build warnings. */
  warnings: string[]
  /** Scans that cannot be trusted: the scanner failed, or it found no React props to check. */
  problems: string[]
  /** The final scan of every such frame that had the scanner installed. */
  scans: (DomPropLeakScan & {frameUrl: string})[]
}

export interface StudioErrorWatcher {
  /**
   * Expect one error matching `matcher`: it does not fail the test. Only errors matching that
   * matcher are suppressed — any other error still fails the test, so unrelated regressions
   * are not accidentally hidden. The matcher is cleared once consumed. If the expected error
   * never arrives, the caller's own assertion (e.g.
   * `expect(studioErrorLocator(page)).toBeVisible()`) is what surfaces the failure.
   */
  expectError: (matcher: StudioErrorMatcher) => void
  /** Scan every open frame and return what the watcher has seen so far, without failing. */
  collectDomPropLeaks: () => Promise<DomPropLeakReport>
  /** Fail with a report of every DOM prop leak seen in the context. Call at the end of a test. */
  flush: () => Promise<void>
}

const SCAN_TIMEOUT = 10_000

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function findingKey(finding: DomPropLeakFinding): string {
  return [finding.rule, finding.tag, finding.prop, finding.components.join('>')].join('|')
}

function frameUrlsOf(page: Page): PageFrameUrls {
  const main = page.mainFrame()
  return {
    main: main.url(),
    children: page
      .frames()
      .filter((frame) => frame !== main)
      .map((frame) => frame.url()),
  }
}

async function scanFrame(frame: Frame): Promise<DomPropLeakScan | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${SCAN_TIMEOUT}ms`)), SCAN_TIMEOUT)
  })
  try {
    return await Promise.race([
      frame.evaluate(() => (window as ScannerWindow).__sanityDomPropLeakScanner?.scan() ?? null),
      timeout,
    ])
  } finally {
    clearTimeout(timer)
  }
}

export function formatDomPropLeakReport(report: DomPropLeakReport): string {
  const lines: string[] = []
  if (report.findings.length > 0) {
    lines.push(
      `${report.findings.length} prop(s) that are not DOM attributes reached DOM elements:`,
      '',
    )
    for (const finding of report.findings) {
      lines.push(
        `- \`${finding.prop}\` on <${finding.tag}> [${finding.rule}]`,
        `  ${finding.message.split('\n')[0]}`,
        `  rendered by: ${finding.components.join(' > ') || '(no named component)'}`,
        `  element: ${finding.element}`,
        `  url: ${finding.url}`,
      )
    }
    lines.push('')
  }
  if (report.warnings.length > 0) {
    lines.push('Development-build warnings about DOM props:', '')
    for (const warning of report.warnings) lines.push(`- ${warning.split('\n')[0]}`)
    lines.push('')
  }
  if (report.problems.length > 0) {
    lines.push('The DOM prop leak scanner could not check every document:', '')
    for (const problem of report.problems) lines.push(`- ${problem}`)
    lines.push('')
  }
  lines.push(
    'Stop the prop at the component that receives it: destructure it before spreading the rest onto the element, or use a `$`-prefixed transient prop for styled components. See e2e/README.md.',
  )
  return lines.join('\n')
}

async function attach(context: BrowserContext): Promise<StudioErrorWatcher> {
  let expected: StudioErrorMatcher | null = null
  const findings = new Map<string, DomPropLeakFinding>()
  const warnings = new Set<string>()

  // Throwing from an event handler fails the running test (Playwright attributes unhandled
  // errors to it), which stops a test on the first error instead of letting it time out.
  function handleError(info: StudioErrorInfo): void {
    if (expected && matches(expected, info)) {
      expected = null
      return
    }
    throw new Error(`Studio threw an unexpected ${info.source}: ${info.message}`)
  }

  function addFinding(finding: DomPropLeakFinding): void {
    const key = findingKey(finding)
    if (!findings.has(key)) findings.set(key, finding)
  }

  context.on('weberror', (webError) => {
    const message = describeError(webError.error())
    if (message.includes('ResizeObserver')) return
    const page = webError.page()
    if (page && isFromForeignFrame({url: webError.location().url, message}, frameUrlsOf(page))) {
      return
    }
    handleError({source: 'pageerror', message})
  })

  context.on('console', (msg) => {
    const type = msg.type()
    if (type !== 'debug' && type !== 'warning' && type !== 'error') return
    const text = msg.text()
    const page = msg.page()
    if (type === 'debug') {
      if (text.startsWith(DOM_PROP_LEAK_MARKER)) {
        const finding = JSON.parse(text.slice(DOM_PROP_LEAK_MARKER.length)) as DomPropLeakFinding
        if (!page || !isForeignDocument(finding.url, page.url())) addFinding(finding)
      }
      return
    }
    if (type === 'error' && text.startsWith(ERROR_SCREEN_MARKER)) {
      handleError({source: 'error-screen', message: text.slice(ERROR_SCREEN_MARKER.length)})
      return
    }
    if (page && isFromForeignFrame({url: msg.location().url, message: text}, frameUrlsOf(page))) {
      return
    }
    if (type === 'warning') {
      if (STYLED_COMPONENTS_UNKNOWN_PROP_WARNING.test(text)) warnings.add(text)
      return
    }
    if (REACT_DOM_PROP_WARNING.test(text)) warnings.add(text)
  })

  await context.addInitScript(
    ({selector, marker}) => {
      let fired = false
      new MutationObserver(() => {
        if (fired) return
        const el = document.querySelector(selector)
        if (el) {
          fired = true
          const detail =
            el.getAttribute('data-error') || el.textContent?.trim().slice(0, 200) || 'Unknown error'
          console.error(`${marker}${detail}`)
        }
      }).observe(document, {childList: true, subtree: true})
    },
    {selector: STUDIO_ERROR_SELECTOR, marker: ERROR_SCREEN_MARKER},
  )
  await context.addInitScript({content: buildDomPropLeakScannerScript(loadDomPropVocabulary())})

  async function collectDomPropLeaks(): Promise<DomPropLeakReport> {
    const frames = context
      .pages()
      .flatMap((page) =>
        page.frames().filter((frame) => !isForeignDocument(frame.url(), page.url())),
      )
    const scans: DomPropLeakReport['scans'] = []
    const problems: string[] = []
    await Promise.all(
      frames.map(async (frame) => {
        const frameUrl = frame.url()
        let scan: DomPropLeakScan | null
        try {
          scan = await scanFrame(frame)
        } catch {
          // The frame navigated, detached or closed since it was listed. Its scanner logged
          // what it found as it happened.
          return
        }
        if (!scan) return
        scans.push({...scan, frameUrl})
        for (const finding of scan.findings) addFinding(finding)
        if (scan.error) {
          problems.push(`${frameUrl}: the scanner threw: ${scan.error}`)
        } else if (scan.studioRendered && scan.stats.reactElements === 0) {
          problems.push(
            `${frameUrl}: the studio rendered, but no element carried \`__reactProps$…\`, which the scanner reads. Did react-dom rename it?`,
          )
        }
      }),
    )
    return {findings: [...findings.values()], warnings: [...warnings], problems, scans}
  }

  return {
    expectError(matcher) {
      expected = matcher
    },
    collectDomPropLeaks,
    async flush() {
      const report = await collectDomPropLeaks()
      if (report.findings.length > 0 || report.warnings.length > 0 || report.problems.length > 0) {
        throw new Error(`DOM prop leak guard failed.\n\n${formatDomPropLeakReport(report)}`)
      }
    },
  }
}

const watchers = new WeakMap<BrowserContext, Promise<StudioErrorWatcher>>()

/**
 * Attach Studio error detection to a browser context, once per context: every call for the same
 * context returns the same watcher. Every page of the context, including ones created before the
 * call, fails the running test on Studio error screens and page errors ({@link StudioErrorSource}).
 *
 * Child frames of another origin than their page, such as the Presentation preview, are other
 * apps: their uncaught exceptions, warnings and DOM prop leaks are left out
 * (`helpers/foreignFrames.ts`).
 *
 * Every document loaded afterwards also runs the DOM prop leak scanner
 * (`helpers/domPropLeaks/scanner.ts`), which checks the props React gives each element against
 * react-dom's and styled-components' development-build rules, so it works against a production
 * build too. Its findings, and the matching development-build warnings
 * ({@link REACT_DOM_PROP_WARNING}, {@link STYLED_COMPONENTS_UNKNOWN_PROP_WARNING}), fail the test
 * when it calls `flush()`, which the `test` fixture of `studio-test.ts` does after every test.
 *
 * ```ts
 * const {expectError} = await watchForStudioErrors(context)
 * expectError(/Session not found/)
 * await expect(studioErrorLocator(page)).toBeVisible()
 * ```
 *
 * The matcher may be a substring, a regexp, or a predicate receiving
 * `{source, message}`:
 *
 * ```ts
 * expectError(({source, message}) => source === 'error-screen' && message.includes('CORS'))
 * ```
 */
export function watchForStudioErrors(context: BrowserContext): Promise<StudioErrorWatcher> {
  let watcher = watchers.get(context)
  if (!watcher) {
    watcher = attach(context)
    watchers.set(context, watcher)
  }
  return watcher
}

/**
 * Run each test of a spec that uses `@playwright/test` directly under
 * {@link watchForStudioErrors}, as the `test` fixture of `studio-test.ts` does for the others.
 * Registers `beforeEach` and `afterEach` hooks in the calling scope.
 */
export function watchEachTestForStudioErrors(
  test: TestType<
    PlaywrightTestArgs & PlaywrightTestOptions,
    PlaywrightWorkerArgs & PlaywrightWorkerOptions
  >,
): void {
  test.beforeEach(async ({context}) => {
    await watchForStudioErrors(context)
  })
  test.afterEach(async ({context}) => {
    await (await watchForStudioErrors(context)).flush()
  })
}
