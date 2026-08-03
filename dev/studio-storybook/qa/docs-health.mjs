#!/usr/bin/env node
/* oxlint-disable no-console -- CLI script; console output is its primary result, not incidental logging */
import {readFileSync, existsSync, statSync, createReadStream} from 'node:fs'
/**
 * Docs-page health gate.
 *
 * The render gate (`qa/run.mjs`) baselines every docs entry as `empty`, because its visibility
 * probe under-reports in docs mode. That is a known limitation and it has now cost us twice: docs
 * pages are the ONE surface both existing gates are blind to, and both times a human found the
 * damage first.
 *
 * A docs page is not just another story. It renders EVERY story of a component into one document,
 * which breaks things that are perfectly fine in isolation:
 *
 *  - STACKED OVERLAYS. A surface that portals a full-viewport overlay is a modal in canvas view and
 *    a page-killer in docs view. Nine SearchPopover stories put nine backdrops over the prose.
 *  - FOCUS-LOCK WARS. Each `react-focus-lock` instance wants the active element. Several on one
 *    page fight, and the page stops responding.
 *  - RUNAWAY HEIGHT. One story with a full-viewport stage becomes a dozen of them, and the page is
 *    unnavigable long before it is unreadable.
 *  - PLAY FUNCTIONS. They run in docs too, so a play function that opens a popover opens it over
 *    the page, once per story.
 *
 * So this checks the things that only go wrong when stories are composed:
 *   node qa/docs-health.mjs --dir storybook-static
 *   node qa/docs-health.mjs --url http://localhost:6060 --only search
 */
import {createServer} from 'node:http'
import {createRequire} from 'node:module'
import {join, extname, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..', '..')
const {chromium} = createRequire(join(REPO, 'package.json'))('playwright')

function arg(n, d) {
  const i = process.argv.indexOf(`--${n}`)
  if (i === -1) return d
  const v = process.argv[i + 1]
  return v && !v.startsWith('--') ? v : true
}
const DIR = arg('dir')
const URL_BASE = arg('url')
const ONLY = arg('only')
const CONC = Number(arg('concurrency', 3))
const SETTLE = Number(arg('settle', 9000))
// Zero tolerance: a layer that escapes its story frame is always wrong on a docs page.
const MAX_OVERLAYS = Number(arg('max-overlays', 0))
const MAX_LOCKS = Number(arg('max-locks', 2))
const MAX_FRAME = Number(arg('max-frame', 700))
const MIN_TEXT = Number(arg('min-text', 200))

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
    const f = join(root, p)
    try {
      if (!statSync(f).isFile()) throw new Error('dir')
    } catch {
      res.statusCode = 404
      return res.end('not found')
    }
    res.setHeader('content-type', MIME[extname(f)] || 'application/octet-stream')
    createReadStream(f).pipe(res)
  })
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({srv, port: srv.address().port})))
}

const probe = () => {
  /*
   * Counting "big positioned elements" is NOT a usable test, and the first version of this gate
   * got it wrong: it reported six healthy pages as broken. Storybook's `.docs-story` wrapper
   * establishes a containing block, so a large absolutely- (or even fixed-) positioned element
   * inside a story stays inside its own frame and obscures nothing. Plenty of legitimate
   * components - panes, virtualized lists, layout shells - are built exactly that way.
   *
   * What actually harms a docs page is a layer that ESCAPES its frame: portalled to <body>, or
   * otherwise positioned over the document. So we test containment, and then confirm the outcome
   * the reader cares about by hit-testing: can you still reach the prose?
   */
  const isBigLayer = (el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    if (cs.position !== 'fixed' && cs.position !== 'absolute') return false
    if (r.width < 700 || r.height < 400) return false
    // an inert measuring element is not an overlay
    if (el.getAttribute('aria-hidden') === 'true' && cs.pointerEvents === 'none') return false
    return true
  }
  const escaped = [...document.querySelectorAll('*')]
    .filter(isBigLayer)
    .filter((el) => !el.closest('.docs-story'))

  // Hit-test down the page: every sampled point should land on prose or inside a story frame,
  // never on a layer floating above the document.
  const obscured = []
  for (const y of [120, 300, 500, 750]) {
    const el = document.elementFromPoint(600, y)
    if (!el) continue
    if (el.closest('.docs-story')) continue
    if (el.closest('.sbdocs-content, .sbdocs-wrapper, .sbdocs')) continue
    obscured.push(
      `${el.tagName}${el.getAttribute('data-ui') ? `[${el.getAttribute('data-ui')}]` : ''} at y=${y}`,
    )
  }

  const frames = [...document.querySelectorAll('.docs-story')].map((e) =>
    Math.round(e.getBoundingClientRect().height),
  )
  return {
    overlays: escaped.length,
    obscured,
    locks: document.querySelectorAll('[data-focus-lock-disabled]').length,
    tallestFrame: frames.length ? Math.max(...frames) : 0,
    frames: frames.length,
    text: (document.body.innerText || '').trim().length,
  }
}

async function checkOne(context, base, id) {
  const page = await context.newPage()
  await page.setViewportSize({width: 1200, height: 900})
  const problems = []
  page.on('pageerror', (e) => problems.push(`throw: ${String(e.message).slice(0, 120)}`))
  try {
    await page.goto(`${base}/iframe.html?id=${encodeURIComponent(id)}&viewMode=docs`, {
      waitUntil: 'load',
      timeout: 30000,
    })
    await page.waitForTimeout(SETTLE)
    const r = await page.evaluate(probe)
    if (r.text < MIN_TEXT)
      problems.push(`blank: only ${r.text} chars of text (page did not render)`)
    if (r.overlays > MAX_OVERLAYS)
      problems.push(
        `${r.overlays} full-screen layer(s) escaped their story frame (max ${MAX_OVERLAYS}) - a portalled surface is rendering inline`,
      )
    if (r.obscured.length)
      problems.push(`prose obscured by a floating layer: ${r.obscured.join(', ')}`)
    if (r.locks > MAX_LOCKS)
      problems.push(`${r.locks} focus locks (max ${MAX_LOCKS}) - competing locks freeze the page`)
    if (r.tallestFrame > MAX_FRAME)
      problems.push(`tallest story frame ${r.tallestFrame}px (max ${MAX_FRAME})`)
  } catch (e) {
    problems.push(`load: ${String(e.message).split('\n')[0].slice(0, 120)}`)
  } finally {
    await page.close().catch(() => {})
  }
  return {id, problems}
}

void (async () => {
  let base = URL_BASE
  let srv = null
  let ids = []
  if (base) {
    ids = Object.keys((await (await fetch(`${base}/index.json`)).json()).entries)
  } else {
    if (!DIR || !existsSync(join(DIR, 'index.json'))) {
      console.error('docs gate: pass --dir <static-build> or --url <running storybook>')
      process.exit(2)
    }
    ids = Object.keys(JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8')).entries)
    const s = await serve(DIR)
    srv = s.srv
    base = `http://127.0.0.1:${s.port}`
  }
  ids = ids.filter((id) => id.endsWith('--docs')).filter((id) => !ONLY || id.includes(ONLY))

  const browser = await chromium.launch({headless: true})
  const context = await browser.newContext({viewport: {width: 1200, height: 900}})
  process.stdout.write(`docs gate: checking ${ids.length} docs page(s) against ${base}\n`)

  const results = []
  let i = 0
  await Promise.all(
    Array.from({length: Math.min(CONC, ids.length)}, async () => {
      while (i < ids.length) {
        const r = await checkOne(context, base, ids[i++])
        results.push(r)
        if (r.problems.length) process.stdout.write(`  FAIL  ${r.id}\n`)
      }
    }),
  )
  await browser.close()
  if (srv) srv.close()

  const failed = results.filter((r) => r.problems.length)
  console.log(
    `\n${results.length} docs page(s): ${results.length - failed.length} ok, ${failed.length} failed`,
  )
  for (const f of failed) {
    console.log(`\nFAIL  ${f.id}`)
    for (const p of f.problems) console.log(`   ${p}`)
  }
  process.exit(failed.length ? 1 : 0)
})()
