#!/usr/bin/env node
import {createReadStream, existsSync, readFileSync, statSync} from 'node:fs'
/**
 * Targeted render check for a handful of story ids.
 *
 * `qa/run.mjs` sweeps the whole catalog, which is right for a gate and wrong for the inner loop:
 * a thousand stories takes long enough that it gets run under load, and a CONTENDED SWEEP LIES.
 * The 2026-07-26 sweep reported 385 empties against a true 175 on the same build, because
 * stories that merely rendered slowly under six-way concurrency were recorded as empty.
 *
 * So this checks only the ids you name, one at a time, with a generous settle. Slower per story
 * and trustworthy, which is the correct trade when the question is "did the thing I just wrote
 * work" rather than "did anything regress".
 *
 * Usage:
 *   node qa/verify-ids.mjs --dir storybook-static <id> [<id> ...]
 *   node qa/verify-ids.mjs --dir storybook-static --prefix forms-input-previewreferencevalue
 */
import {createServer} from 'node:http'
import {createRequire} from 'node:module'
import {dirname, extname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..', '..')
const {chromium} = createRequire(join(REPO, 'package.json'))('playwright')

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`)
  if (i === -1) return d
  const v = process.argv[i + 1]
  return v && !v.startsWith('--') ? v : true
}
const DIR = arg('dir', 'storybook-static')
const PREFIX = arg('prefix', null)
const SETTLE = Number(arg('settle', 3500))

if (!existsSync(join(DIR, 'index.json'))) {
  console.error('verify-ids: --dir must be a Storybook static build. Got:', DIR)
  process.exit(2)
}

const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8'))
const all = Object.values(index.entries || {})

// Positional ids are everything after argv[1] that is neither a flag nor a flag's value.
// The first version filtered out any token containing `--`, which silently excluded EVERY docs
// id, because they all end in `--docs`. It reported "no matching stories" rather than failing.
const FLAGS = new Set(['--dir', '--prefix', '--settle'])
const named = []
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i]
  if (a.startsWith('--')) {
    if (FLAGS.has(a)) i++ // skip its value
    continue
  }
  named.push(a)
}

let targets
if (PREFIX) {
  targets = all.filter((e) => e.id.startsWith(PREFIX))
} else {
  const wanted = new Set(named)
  targets = all.filter((e) => wanted.has(e.id))
}
if (!targets.length) {
  console.error('verify-ids: no matching stories. Checked', all.length, 'entries.')
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

const BENIGN = [
  /ReactDOM.render is no longer supported/i,
  /Warning: .*act\(/i,
  /Download the React DevTools/i,
  /Support for defaultProps/i,
  /Failed to load resource.*40[34]/i,
]
const isBenign = (t) => BENIGN.some((re) => re.test(t))

const {srv, port} = await serve(DIR)
const base = `http://127.0.0.1:${port}`
const browser = await chromium.launch()
const context = await browser.newContext({viewport: {width: 1280, height: 900}})

let bad = 0
for (const entry of targets) {
  const page = await context.newPage()
  // Thrown and logged are different failures and get counted separately.
  //
  // A page error means the render died. A console error very often means the component under
  // test caught something and said so: `useReferenceInfo` calls `console.error(err)` inside its
  // own `catchError` before returning the error state, so a story that deliberately exercises
  // the error branch logs by design and still renders correctly. Collapsing the two made three
  // working stories read as broken.
  const errs = []
  const logs = []
  page.on('pageerror', (e) => errs.push(String(e?.message ?? e).slice(0, 240)))
  page.on('console', (m) => {
    if (m.type() === 'error' && !isBenign(m.text())) logs.push(m.text().slice(0, 240))
  })
  const url = `${base}/iframe.html?id=${entry.id}&viewMode=${entry.type === 'docs' ? 'docs' : 'story'}`
  let text = ''
  let html = 0
  try {
    await page.goto(url, {waitUntil: 'load', timeout: 45000})
    await page.waitForTimeout(SETTLE)
    // Try each root SEPARATELY and take the first one with content, then fall back to the body.
    //
    // A comma-separated `querySelector` returns the first match in DOCUMENT ORDER, not in the
    // order the selectors are written. On a docs page `#storybook-root` exists and is EMPTY,
    // while the real content sits in a later node, so the combined selector always picked the
    // empty one and every docs page reported EMPTY with zero errors. `qa/run.mjs` uses the same
    // combined selector and so has the same blind spot.
    const measured = await page.evaluate(() => {
      // Storybook's error display is a RENDER, and a plausible-looking one: it has text, it has
      // markup, and a React error boundary catches the throw so nothing reaches `pageerror`.
      // Without this check a story that throws every time reports OK with a healthy byte count.
      // It is how eight broken stories passed: every one measured an identical 1,597 characters,
      // because that is the size of the overlay rather than of anything they render.
      // VISIBILITY, not presence. Storybook ships this element pre-rendered and hidden on every
      // page, with its explanatory boilerplate already in the markup, so testing `innerHTML`
      // alone condemns the entire catalog: it reported EMPTY for eighteen stories that had just
      // verified clean minutes earlier. A hidden node has a zero-size bounding rect.
      const overlay = document.querySelector('#storybook-error, .sb-errordisplay, #error-message')
      if (overlay) {
        const r = overlay.getBoundingClientRect()
        if (r.width > 2 && r.height > 2) {
          return {text: '', html: 0, overlay: (overlay.innerText || '').trim().slice(0, 200)}
        }
      }
      const roots = ['#storybook-docs', '.sbdocs-wrapper', '.sbdocs', '#storybook-root', '#root']
      for (const sel of roots) {
        const el = document.querySelector(sel)
        if (el && (el.innerHTML || '').length > 40) {
          return {text: (el.innerText || '').trim(), html: el.innerHTML.length, via: sel}
        }
      }
      const b = document.body
      return {text: (b?.innerText || '').trim(), html: (b?.innerHTML || '').length, via: 'body'}
    })
    text = measured.text
    html = measured.html
    if (measured.overlay) errs.push(`OVERLAY: ${measured.overlay}`)
  } catch (e) {
    errs.push(`NAV: ${String(e?.message ?? e).slice(0, 200)}`)
  }
  await page.close()

  // Empty means empty: no text AND effectively no markup. A story can legitimately render
  // no text (an icon, a bar) and still be a real render, so text alone is not the test.
  const empty = !text && html < 120
  const failed = empty || errs.length > 0
  if (failed) bad++
  const mark = failed ? (empty ? 'EMPTY' : 'ERR  ') : logs.length ? 'LOG  ' : 'OK   '
  const detail = [...errs.slice(0, 2), ...logs.slice(0, 1)]
  process.stdout.write(
    `${mark} ${entry.id}  text=${text.length} html=${html}` +
      (detail.length ? `\n      ${detail.join('\n      ')}` : '') +
      '\n',
  )
}

await browser.close()
srv.close()
process.stdout.write(`\n${targets.length - bad}/${targets.length} clean\n`)
process.exit(bad ? 1 : 0)
