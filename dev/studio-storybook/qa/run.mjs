#!/usr/bin/env node
/* oxlint-disable no-console -- CLI script; console output is its primary result, not incidental logging */
import {readFileSync, writeFileSync, existsSync, statSync, createReadStream} from 'node:fs'
/**
 * Storybook QA regression gate.
 *
 * Builds nothing itself: point it at a static Storybook build directory (from `storybook build
 * -o <dir>`). It serves that dir, sweeps every story and docs entry headlessly, classifies each
 * (fail / empty / warn / ok using the real-vs-artifact signals), and diffs the result against a
 * committed baseline.json. It reports ONLY regressions (an entry that got worse than baseline),
 * so the timing artifacts and intentional empty states that are already baselined stay quiet.
 *
 * Usage:
 *   node qa/run.mjs --dir <static-build-dir> [--settle 2500] [--concurrency 6]
 *   node qa/run.mjs --dir <static-build-dir> --update-baseline     # accept current state as baseline
 *
 * Exit code 1 if there are regressions, else 0. Playwright is resolved from the repo root.
 */
import {createServer} from 'node:http'
import {createRequire} from 'node:module'
import {join, extname, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..', '..') // dev/studio-storybook/qa -> repo root
const {chromium} = createRequire(join(REPO, 'package.json'))('playwright')

function arg(n, d) {
  const i = process.argv.indexOf(`--${n}`)
  if (i === -1) return d
  const v = process.argv[i + 1]
  return v && !v.startsWith('--') ? v : true
}
const DIR = arg('dir')
const SETTLE = Number(arg('settle', 2500))
const CONC = Number(arg('concurrency', 6))
const UPDATE = Boolean(arg('update-baseline', false))
const BASELINE = arg('baseline', join(HERE, 'baseline.json'))
if (!DIR || !existsSync(join(DIR, 'index.json'))) {
  console.error('QA gate: --dir must be a Storybook static build (with index.json). Got:', DIR)
  process.exit(2)
}

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.map': 'application/json',
  '.ico': 'image/x-icon',
}
function serve(root) {
  const srv = createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0])
    if (p.endsWith('/')) p += 'index.html'
    let f = join(root, p)
    try {
      if (!statSync(f).isFile()) throw new Error('dir')
    } catch {
      res.statusCode = 404
      return res.end('not found')
    }
    res.setHeader('content-type', MIME[extname(f)] || 'application/octet-stream')
    createReadStream(f).pipe(res)
  })
  return new Promise((resolve) =>
    srv.listen(0, '127.0.0.1', () => resolve({srv, port: srv.address().port})),
  )
}

// The mock-scheme line is ledger finding 169: the latency telemetry probe issues a raw fetch
// outside the client transport, the mock's non-http scheme rejects it (by design), and Chrome
// logs this before any catch can run. It is a telemetry probe colliding with the test seam, not
// a UI regression. Note the release-summary stories keep their WARN through their own secondary
// "Failed to fetch or parse document history" message, which is deliberately NOT benign: there
// the same mechanism visibly breaks preview resolution rather than just making noise.
const BENIGN = [
  /ReactDOM.render is no longer supported/i,
  /Warning: .*act\(/i,
  /Download the React DevTools/i,
  /Support for defaultProps/i,
  /Failed to load resource.*40[34]/i,
  /URL scheme "mock" is not supported/i,
]
const isBenign = (t) => BENIGN.some((re) => re.test(t))

async function sweepOne(context, base, entry) {
  const isDocs = entry.type === 'docs'
  const page = await context.newPage()
  if (isDocs) await page.setViewportSize({width: 1280, height: 1600})
  const pageErrors = []
  const consoleErrors = []
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e).slice(0, 200)))
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text().slice(0, 200)
      consoleErrors.push({t, benign: isBenign(t)})
    }
  })
  const url = `${base}/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=${isDocs ? 'docs' : 'story'}`
  const probeFn = () => {
    const root = document.querySelector(
      '#storybook-root, #root, .sbdocs-wrapper, .sbdocs, #storybook-docs',
    )
    const overlayEl = document.querySelector('#storybook-error, .sb-errordisplay, #error-message')
    let overlayVisible = false
    if (overlayEl) {
      const cs = getComputedStyle(overlayEl)
      const r = overlayEl.getBoundingClientRect()
      if (cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 5 && r.height > 5)
        overlayVisible = true
    }
    const bodyText = document.body ? document.body.innerText : ''
    const sbError = /Sorry, but you either have no stories|Couldn.t find story|doesn.t exist/i.test(
      bodyText,
    )
    let visible = false
    if (root)
      for (const el of root.querySelectorAll('*')) {
        const r = el.getBoundingClientRect()
        if (r.width > 2 && r.height > 2) {
          visible = true
          break
        }
      }
    return {overlay: overlayVisible || sbError, visible}
  }
  const classify = (probe) => {
    if (pageErrors.length || probe.overlay) return 'fail'
    if (!probe.visible) return 'empty'
    if (consoleErrors.filter((c) => !c.benign).length) return 'warn'
    return 'ok'
  }
  let status = 'ok'
  try {
    await page.goto(url, {waitUntil: 'load', timeout: 25000})
    await page.waitForTimeout(isDocs ? SETTLE + 800 : SETTLE)
    status = classify(await page.evaluate(probeFn))
    // Retry an empty once with a much longer wait: heavy stories (CodeMirror, panes, mocks)
    // paint late, so a lone empty is usually timing, not a defect. This keeps the gate honest.
    if (status === 'empty') {
      await page.waitForTimeout(SETTLE + 3000)
      status = classify(await page.evaluate(probeFn))
    }
  } catch (e) {
    status = 'fail'
  } finally {
    await page.close().catch(() => {})
  }
  return {id: entry.id, status}
}

const RANK = {ok: 0, warn: 1, empty: 2, fail: 3}

void (async () => {
  const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8'))
  const entries = Object.values(index.entries || {}).filter(
    (e) => e.type === 'story' || e.type === 'docs',
  )
  const {srv, port} = await serve(DIR)
  const base = `http://127.0.0.1:${port}`
  const browser = await chromium.launch({headless: true})
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    deviceScaleFactor: 1,
  })

  const results = {}
  let idx = 0
  process.stdout.write(
    `QA gate: sweeping ${entries.length} entries (concurrency ${CONC}, settle ${SETTLE}ms)\n`,
  )
  async function worker() {
    while (idx < entries.length) {
      const e = entries[idx++]
      const r = await sweepOne(context, base, e)
      results[r.id] = r.status
      if (idx % 50 === 0) process.stdout.write(`  ...${idx}/${entries.length}\n`)
    }
  }
  await Promise.all(Array.from({length: CONC}, worker))
  await browser.close()
  srv.close()

  // The two numbers that need to confront each other on every run: a baseline that covers less
  // of the catalog than it sweeps was silently passing entries the gate never actually checked.
  const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {}
  const ids = Object.keys(results)
  const baselinedCount = ids.filter((id) => baseline[id] !== undefined).length
  console.log(
    `coverage: swept ${ids.length}, baselined ${baselinedCount}, unbaselined ${ids.length - baselinedCount}`,
  )

  if (UPDATE) {
    writeFileSync(BASELINE, JSON.stringify(results, Object.keys(results).sort(), 1) + '\n')
    const counts = Object.values(results).reduce((a, s) => ((a[s] = (a[s] || 0) + 1), a), {})
    console.log(`baseline updated: ${ids.length} entries`, JSON.stringify(counts))
    process.exit(0)
  }

  const regressions = []
  const fixes = []
  const newIds = []
  // Unbaselined entries are not diffed against anything (there is nothing to diff against), but
  // an unbaselined entry that outright FAILS is not a coverage gap, it is a failure the gate
  // found and must not swallow. Unbaselined empty/warn stay print-only: an empty docs artifact is
  // an instrument limitation (see README), not evidence of a defect, so it does not fail the gate
  // on discovery alone, it just asks a human to baseline it.
  const unbaselinedFail = []
  for (const [id, status] of Object.entries(results)) {
    const was = baseline[id]
    if (was === undefined) {
      if (RANK[status] >= RANK.empty) newIds.push({id, status})
      if (status === 'fail') unbaselinedFail.push({id, status})
      continue
    }
    if (RANK[status] > RANK[was]) regressions.push({id, was, now: status})
    else if (RANK[status] < RANK[was]) fixes.push({id, was, now: status})
  }
  const counts = Object.values(results).reduce((a, s) => ((a[s] = (a[s] || 0) + 1), a), {})
  console.log(`\nswept ${ids.length} entries: ${JSON.stringify(counts)}`)
  if (fixes.length)
    console.log(
      `\n${fixes.length} improved since baseline:`,
      fixes
        .slice(0, 20)
        .map((f) => `${f.id} ${f.was}->${f.now}`)
        .join(', '),
    )
  if (newIds.length)
    console.log(
      `\n${newIds.length} NEW entries not in baseline that fail/empty (add to baseline if intentional):\n` +
        newIds.map((n) => `  ${n.status.toUpperCase()}  ${n.id}`).join('\n'),
    )
  if (regressions.length) {
    console.log(`\nREGRESSIONS (${regressions.length}) - entries that got worse than baseline:`)
    for (const r of regressions)
      console.log(`  ${r.was.toUpperCase()} -> ${r.now.toUpperCase()}  ${r.id}`)
  }
  if (unbaselinedFail.length) {
    console.log(
      `\nUNBASELINED FAILURES (${unbaselinedFail.length}) - never baselined, and failing now, not a coverage gap:`,
    )
    for (const f of unbaselinedFail) console.log(`  FAIL  ${f.id}`)
  }
  if (regressions.length || unbaselinedFail.length) process.exit(1)
  console.log('\nQA gate: PASS (no regressions against baseline).')
  process.exit(0)
})()
