#!/usr/bin/env node
/* oxlint-disable no-console -- CLI script; console output is its primary result, not incidental logging */
import {readFileSync, existsSync, statSync, createReadStream, mkdirSync} from 'node:fs'
/**
 * Storybook INTERACTION gate.
 *
 * The render gate (`qa/run.mjs`) answers "did it mount?". That is not enough: a menu can mount
 * perfectly and then throw the moment you open it, or open into a canvas too small to contain it.
 * Both shipped in the navbar wave and were caught by a human, not by the gate. This tool closes
 * that hole: it DRIVES each story (click, type, press) and asserts on what happens after.
 *
 * Three assertions, each on a real failure we have actually seen:
 *
 *  1. THROW   - any pageerror raised during or after the interaction (the PresenceMenu crash:
 *               `Cannot read properties of null (reading 'sanity.project.members')`).
 *  2. CROP    - any floating layer (popover / menu / dialog, portaled to <body>) whose box escapes
 *               the story viewport. This is the "menu opens but gets cropped" defect. A portaled
 *               layer that overflows the iframe is invisible to the user and invisible to a
 *               render-only probe, because the mount itself succeeded.
 *  3. EXPECT  - an explicit selector/text that must be present after the steps, so "the click did
 *               nothing" fails loudly instead of passing quietly.
 *
 * A spec normally drives a story at `viewMode=story`. Set `viewMode: 'docs'` on a spec to drive
 * it on its DOCS page instead: `id` becomes the docs entry (e.g. `foo-bar--docs`) and `heading`
 * names the embedded story to act on (its exact display name). This exists because the docs page
 * stacks every story of a component into its own fixed-height inline canvas, which is a genuinely
 * different failure surface from the story page: a popover that opens cleanly at `viewMode=story`
 * can still portal outside that canvas or get clipped by it at `viewMode=docs`, and the render
 * gate's docs sweep never opens anything, so nothing else in the fleet checks this. click/type/
 * waitFor steps are scoped to the located story's own section (a docs page is one long scroll of
 * many stories sharing generic selectors like "button"); `expect` is intentionally left unscoped,
 * since the defect this exists to catch is content escaping that section entirely.
 *
 * Specs live in `qa/interactions.mjs`. Run against a static build (authoritative, matches the
 * render gate) or against a running dev server (fast iteration):
 *
 *   node qa/interact.mjs --dir <static-build-dir>
 *   node qa/interact.mjs --url http://localhost:6060
 *   node qa/interact.mjs --url http://localhost:6060 --only presence     # substring filter on id
 *   node qa/interact.mjs --dir <dir> --shots qa/shots                    # save a PNG per spec
 *
 * Exit code 1 if any spec fails, else 0.
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
const SHOTS = arg('shots')
const SETTLE = Number(arg('settle', 2000))
const CONC = Number(arg('concurrency', 4))
const HEADED = Boolean(arg('headed', false))

if (!DIR && !URL_BASE) {
  console.error('interaction gate: pass --dir <static-build> or --url <running storybook>')
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

/**
 * Crop probe - two distinct mechanisms, both of which read to a user as "the menu is cut off".
 *
 *  (a) OVERFLOW: the layer's box escapes the viewport. Naive, and rarer than you would think.
 *  (b) CLIP:     the layer stays inside the viewport but shrinks and hides its own content
 *                (scrollHeight > clientHeight). This is what @sanity/ui actually does - Popover
 *                constrains itself to the available space rather than overflowing - so a probe
 *                that only checks (a) reports "fine" on a menu that is visibly truncated.
 *
 * We check both. (b) is the one that matters in practice.
 */
const cropProbeFn = () => {
  const SEL = [
    '[data-ui="Popover"]',
    '[data-ui="Dialog"]',
    '[data-ui="Menu"]',
    '[data-ui="Layer"] [data-ui="Card"]',
    '[role="dialog"]',
    '[role="menu"]',
    '[role="listbox"]',
  ].join(',')
  const vw = window.innerWidth
  const vh = window.innerHeight
  const out = []
  for (const el of document.querySelectorAll(SEL)) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue
    const r = el.getBoundingClientRect()
    if (r.width < 8 || r.height < 8) continue
    // only consider genuinely floating layers (portaled / positioned out of flow)
    const floating = cs.position === 'fixed' || cs.position === 'absolute'
    if (!floating) continue

    const label = el.getAttribute('data-ui') || el.getAttribute('role') || el.tagName.toLowerCase()
    const box = {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
    }
    const text = (el.innerText || '').trim().slice(0, 60).replace(/\s+/g, ' ')

    // (a) escapes the viewport
    const over = {
      right: Math.round(r.right - vw),
      bottom: Math.round(r.bottom - vh),
      left: Math.round(-r.left),
      top: Math.round(-r.top),
    }
    const worst = Math.max(over.right, over.bottom, over.left, over.top)
    if (worst > 2) {
      out.push({
        kind: 'overflow',
        tag: label,
        detail: `${label} ${box.w}x${box.h} at (${box.x},${box.y}) escapes ${Object.entries(over).sort((a, b) => b[1] - a[1])[0][0]} by ${worst}px of ${vw}x${vh}`,
        text,
      })
      continue
    }

    // (b) fits, but truncates its own content
    const clipY = el.scrollHeight - el.clientHeight
    const clipX = el.scrollWidth - el.clientWidth
    const scrollable = /auto|scroll/.test(cs.overflowY) || /auto|scroll/.test(cs.overflowX)
    if ((clipY > 4 || clipX > 4) && !scrollable) {
      out.push({
        kind: 'clip',
        tag: label,
        detail: `${label} ${box.w}x${box.h} hides ${clipY > 4 ? `${clipY}px of height` : `${clipX}px of width`} (overflow:${cs.overflowY}/${cs.overflowX}) in a ${vw}x${vh} canvas`,
        text,
      })
    }
  }
  return out
}

/**
 * Docs-mode popover probe. Two checks the crop probe above cannot make, both confirmed
 * empirically against the two static trees this capability was built to validate against:
 *
 *  (a) ESCAPE - the crop probe only looks at genuinely floating layers (`position: fixed`/
 *      `absolute`), because on the story surface that is the only way a layer gets away from its
 *      trigger. On the docs surface a layer can portal out of its own `.docs-story` section and
 *      land in ordinary static document flow elsewhere on the (very long) page - still outside
 *      the section a reader is looking at, but invisible to the floating-only check, since it
 *      never overflows a viewport or clips its own content once it lands. Confirmed on
 *      storybook-served: the plain `@sanity/ui` `Menu` in the ArrayOfPrimitivesFunctions spec
 *      resolves to a normal, reasonably-sized, `position: static` box after escaping its section.
 *  (b) INTERIM CLIP - a popover that DID stay in its section can still be a few px too short for
 *      its own content, and answer that by growing an internal scrollbar rather than by growing
 *      itself. The crop probe deliberately does not flag that (`!scrollable` guard: an internal
 *      scrollbar is a working affordance, not lost content), but here the point is the popover's
 *      own intended size versus what it actually got, so a popover-internal Card constraining
 *      itself below its content height counts even though the content is technically reachable.
 *      Confirmed on storybook-candidate: `[data-ui="Card"]` inside `[data-ui="Popover"]` measures
 *      289 clientHeight vs 319 scrollHeight (30px short) - the interim `minHeight` fix, not yet
 *      the final one. Walks descendants rather than only the SEL match itself, because this Card
 *      sits under `Popover > Popover__wrapper > Flex > Card`, not the `[data-ui="Layer"] [data-ui="Card"]`
 *      shape the crop probe's own selector expects.
 */
const docsPopoverProbeFn = (scopeSelector) => {
  const SEL = [
    '[data-ui="Popover"]',
    '[data-ui="Dialog"]',
    '[data-ui="Menu"]',
    '[data-ui="Layer"] [data-ui="Card"]',
    '[role="dialog"]',
    '[role="menu"]',
    '[role="listbox"]',
  ].join(',')
  const scope = document.querySelector(scopeSelector)
  const out = []
  for (const el of document.querySelectorAll(SEL)) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue
    const r = el.getBoundingClientRect()
    if (r.width < 8 || r.height < 8) continue

    const label = el.getAttribute('data-ui') || el.getAttribute('role') || el.tagName.toLowerCase()
    const text = (el.innerText || '').trim().slice(0, 60).replace(/\s+/g, ' ')

    if (!(scope && scope.contains(el))) {
      out.push({
        kind: 'escaped-canvas',
        detail: `${label} ${Math.round(r.width)}x${Math.round(r.height)} at (${Math.round(r.x)},${Math.round(r.y)}) rendered outside its own docs-story section`,
        text,
      })
      continue // an escaped layer's own internal sizing is moot until it is back in its section
    }

    // @sanity/ui type primitives (Text/Heading/Code/Label) set their own box to the trimmed cap
    // band and paint glyphs OUTSIDE it on purpose (the same fact the crop detector was calibrated
    // against earlier): a bare Text and even its immediate Flex/Stack wrapper routinely show a few
    // px of "scrollHeight > clientHeight" that is not a defect, it is the font. The discriminator
    // that holds is `overflow`: a genuine size constraint is a deliberate `overflow: auto/hidden/
    // scroll/clip` on THAT element; ink bleeding past an unconstrained box stays `overflow: visible`
    // the whole way up. Require the constraint, not just the number, on the axis that is short.
    for (const d of [el, ...el.querySelectorAll('*')]) {
      const dcs = getComputedStyle(d)
      const clipY = d.scrollHeight - d.clientHeight
      const clipX = d.scrollWidth - d.clientWidth
      const constrainedY = clipY > 4 && dcs.overflowY !== 'visible'
      const constrainedX = clipX > 4 && dcs.overflowX !== 'visible'
      if (!constrainedY && !constrainedX) continue
      const dLabel = d.getAttribute('data-ui') || d.tagName.toLowerCase()
      out.push({
        kind: 'clip',
        detail: `${label}'s own ${dLabel} (overflow-y:${dcs.overflowY}/overflow-x:${dcs.overflowX}) hides ${constrainedY ? `${clipY}px of height` : `${clipX}px of width`} (${d.clientHeight}x${d.clientWidth} of ${d.scrollHeight}x${d.scrollWidth} needed)`,
        text,
      })
      break // one clip finding per popover is enough; more would just repeat the ancestor chain
    }
  }
  return out
}

const errorOverlayFn = () => {
  const el = document.querySelector('#storybook-error, .sb-errordisplay, #error-message')
  if (!el) return null
  const cs = getComputedStyle(el)
  const r = el.getBoundingClientRect()
  if (cs.display === 'none' || cs.visibility === 'hidden' || r.width < 5 || r.height < 5)
    return null
  return (el.innerText || '').trim().slice(0, 200)
}

/**
 * Locate the `.docs-story` section for one embedded story on a docs page, by its exact display
 * name (the same text the sidebar/autodocs "Primary"/"Stories" blocks show, i.e. the story's
 * `name` as it appears in the index - `[data-name]` on the inner `.sb-story` element). Returns
 * the `#story--...` id to scope subsequent steps to, or null if no section matches.
 *
 * Docs pages commonly render the first story twice (Storybook's own "Primary" block, then again
 * in the full "Stories" list), both carrying the same heading text - we return the first match,
 * which is deterministic and sufficient since both instances are the same content.
 */
const locateDocsStoryFn = (heading) => {
  const wrappers = Array.from(document.querySelectorAll('.docs-story'))
  for (const w of wrappers) {
    const nameEl = w.querySelector('[data-name]')
    if (nameEl && nameEl.getAttribute('data-name') === heading) {
      const inner = w.querySelector('.sb-story')
      if (inner && inner.id) return inner.id
    }
  }
  return null
}

async function runSpec(context, base, spec) {
  const page = await context.newPage()
  const viewport = spec.viewport || {width: 1280, height: 900}
  await page.setViewportSize(viewport)
  const pageErrors = []
  const consoleErrors = []
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e).slice(0, 240)))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text().slice(0, 240)
    if (!isBenign(t)) consoleErrors.push(t)
  })

  const problems = []
  const isDocs = spec.viewMode === 'docs'
  const url = `${base}/iframe.html?id=${encodeURIComponent(spec.id)}&viewMode=${isDocs ? 'docs' : 'story'}`
  // For a docs spec, `spec.id` is the DOCS entry (e.g. `foo-bar--docs`) and `spec.heading` names
  // the embedded story within it (its exact display name) - click/type/waitFor selectors below
  // are scoped to that story's own `.docs-story` section, which matters on a busy docs page
  // where several stories share generic selectors like "button". `expect` stays unscoped: the
  // whole point of this class is that a popover can portal OUTSIDE its story's section, so
  // asserting only inside the section would hide exactly the defect being tested for.
  let scope = null
  try {
    await page.goto(url, {waitUntil: 'load', timeout: 30000})
    await page.waitForTimeout(spec.settle ?? SETTLE)

    if (isDocs) {
      if (!spec.heading) {
        problems.push({kind: 'load', phase: 'setup', detail: 'docs spec is missing `heading`'})
      } else {
        const storyElId = await page.evaluate(locateDocsStoryFn, spec.heading)
        if (!storyElId) {
          problems.push({
            kind: 'load',
            phase: 'locate-heading',
            detail: `no .docs-story section found with heading "${spec.heading}"`,
          })
        } else {
          scope = `#${storyElId}`
          await page.locator(scope).scrollIntoViewIfNeeded({timeout: 8000})
          await page.waitForTimeout(300) // let the scroll (and any lazy content) settle
        }
      }
    }
    // a docs spec with nothing to scope to has nowhere sensible to click; the setup problem is
    // already recorded above, so skip driving the page rather than let scoped selectors fall
    // back to the whole (very busy) docs page.
    if (!isDocs || scope) {
      const mountErrors = pageErrors.length
      if (mountErrors) problems.push({kind: 'throw', phase: 'mount', detail: pageErrors[0]})

      for (const [i, step] of (spec.steps || []).entries()) {
        const where = `step ${i + 1} (${Object.keys(step)
          .filter((k) => k !== 'note')
          .join('+')})`
        const within = (selector) =>
          scope ? page.locator(scope).locator(selector) : page.locator(selector)
        try {
          if (step.click) {
            const loc = within(step.click).first()
            await loc.waitFor({state: 'visible', timeout: step.timeout ?? 8000})
            await loc.click({timeout: step.timeout ?? 8000})
          }
          if (step.type) {
            const loc = within(step.type.selector).first()
            await loc.waitFor({state: 'visible', timeout: step.timeout ?? 8000})
            await loc.click()
            await loc.fill('')
            await loc.type(step.type.text, {delay: 25})
          }
          if (step.press) await page.keyboard.press(step.press)
          if (step.waitFor) {
            await within(step.waitFor)
              .first()
              .waitFor({state: 'visible', timeout: step.timeout ?? 10000})
          }
          await page.waitForTimeout(step.settle ?? 700)
        } catch (e) {
          problems.push({
            kind: 'step',
            phase: where,
            detail: String(e.message || e)
              .split('\n')[0]
              .slice(0, 200),
          })
          break
        }

        // after EVERY step: did we throw, and did anything float off-screen?
        if (
          pageErrors.length > mountErrors &&
          !problems.some((p) => p.kind === 'throw' && p.phase === where)
        ) {
          problems.push({kind: 'throw', phase: where, detail: pageErrors[pageErrors.length - 1]})
        }
        const overlay = await page.evaluate(errorOverlayFn)
        if (overlay && !problems.some((p) => p.kind === 'overlay')) {
          problems.push({kind: 'overlay', phase: where, detail: overlay})
        }
        const crops = await page.evaluate(cropProbeFn)
        for (const c of crops) {
          problems.push({
            kind: c.kind,
            phase: where,
            detail: `${c.detail}${c.text ? ` - "${c.text}"` : ''}`,
          })
        }
        if (isDocs && scope) {
          const findings = await page.evaluate(docsPopoverProbeFn, scope)
          for (const f of findings) {
            problems.push({
              kind: f.kind,
              phase: where,
              detail: `${f.detail}${f.text ? ` - "${f.text}"` : ''}`,
            })
          }
        }
      }

      // explicit expectations, so "the click did nothing" cannot pass quietly
      for (const exp of spec.expect || []) {
        try {
          if (typeof exp === 'string') {
            await page.locator(exp).first().waitFor({state: 'visible', timeout: 6000})
          } else if (exp.text) {
            await page
              .getByText(exp.text, {exact: false})
              .first()
              .waitFor({state: 'visible', timeout: 6000})
          } else if (exp.countAtLeast) {
            const n = await page.locator(exp.selector).count()
            if (n < exp.countAtLeast) throw new Error(`found ${n}, expected >= ${exp.countAtLeast}`)
          }
        } catch (e) {
          problems.push({
            kind: 'expect',
            phase: JSON.stringify(exp),
            detail: String(e.message || e)
              .split('\n')[0]
              .slice(0, 160),
          })
        }
      }

      if (consoleErrors.length)
        problems.push({kind: 'console', phase: 'run', detail: consoleErrors[0]})

      if (SHOTS) {
        mkdirSync(SHOTS, {recursive: true})
        await page
          .screenshot({
            path: join(SHOTS, `${spec.id.replace(/[^a-z0-9-]/gi, '_')}.png`),
            fullPage: false,
          })
          .catch(() => {})
      }
    }
  } catch (e) {
    problems.push({
      kind: 'load',
      phase: 'goto',
      detail: String(e.message || e)
        .split('\n')[0]
        .slice(0, 200),
    })
  } finally {
    await page.close().catch(() => {})
  }
  // dedupe: one line per (kind, detail)
  const seen = new Set()
  const unique = problems.filter((p) => {
    const k = `${p.kind}|${p.detail}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return {id: specLabel(spec), problems: unique}
}

const specLabel = (s) => s.name || s.id

void (async () => {
  const {specs} = await import(join(HERE, 'interactions.mjs'))
  const list = specs.filter(
    (s) =>
      !ONLY ||
      s.id.includes(ONLY) ||
      (s.name || '').toLowerCase().includes(String(ONLY).toLowerCase()),
  )
  if (!list.length) {
    console.error(`interaction gate: no specs matched --only "${ONLY}"`)
    process.exit(2)
  }

  let base = URL_BASE
  let srv = null
  if (!base) {
    if (!existsSync(join(DIR, 'index.json'))) {
      console.error('interaction gate: --dir must be a Storybook static build (with index.json)')
      process.exit(2)
    }
    const s = await serve(DIR)
    srv = s.srv
    base = `http://127.0.0.1:${s.port}`
  }

  const browser = await chromium.launch({headless: !HEADED})
  const context = await browser.newContext({
    viewport: {width: 1280, height: 900},
    deviceScaleFactor: 1,
  })
  // A story that only works in a roomy canvas is not proven. Any spec that opens a floating layer
  // is run at BOTH a roomy and a tight canvas, because "the menu is cut off" is a small-canvas
  // defect by nature and a 1280x900 run will never see it.
  const TIGHT = {width: 900, height: 420}
  const jobs = []
  for (const spec of list) {
    jobs.push(spec)
    if (spec.alsoTight !== false && (spec.steps || []).length) {
      jobs.push({
        ...spec,
        viewport: spec.tightViewport || TIGHT,
        name: `${specLabel(spec)} [tight ${(spec.tightViewport || TIGHT).width}x${(spec.tightViewport || TIGHT).height}]`,
      })
    }
  }
  process.stdout.write(
    `interaction gate: driving ${jobs.length} run(s) from ${list.length} spec(s) against ${base}\n`,
  )

  const results = []
  let i = 0
  await Promise.all(
    Array.from({length: Math.min(CONC, jobs.length)}, async () => {
      while (i < jobs.length) {
        const spec = jobs[i++]
        let r = await runSpec(context, base, spec)
        // Retry a failure once, serially-ish and with more patience. Interaction specs are far more
        // timing-sensitive than render checks (a popover animating in, a query resolving, a dev
        // server mid-reload), and a gate that reports phantom failures is a gate people stop
        // reading. A real defect fails twice; a flake does not.
        if (r.problems.length) {
          const retry = await runSpec(context, base, {
            ...spec,
            settle: (spec.settle ?? SETTLE) + 2500,
          })
          if (!retry.problems.length) {
            process.stdout.write(`  ok    ${r.id}  (passed on retry; first attempt was flaky)\n`)
            results.push(retry)
            continue
          }
          r = retry
        }
        results.push(r)
        process.stdout.write(r.problems.length ? `  FAIL  ${r.id}\n` : `  ok    ${r.id}\n`)
      }
    }),
  )
  await browser.close()
  if (srv) srv.close()

  const failed = results.filter((r) => r.problems.length)
  console.log(
    `\n${results.length} spec(s): ${results.length - failed.length} ok, ${failed.length} failed`,
  )
  for (const f of failed) {
    console.log(`\nFAIL  ${f.id}`)
    for (const p of f.problems) console.log(`   [${p.kind}] ${p.phase}: ${p.detail}`)
  }
  process.exit(failed.length ? 1 : 0)
})()
