#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Lean before/after visual evidence for a PR — no full studio, no auth, no real data.
 *
 * Given an evidence story (`*.evidence.tsx`) that renders the changed
 * component in a real headless Chromium (via the existing vitest browser harness) and
 * captures a screenshot to `<testdir>/.visual-evidence/<name>.png`, this script:
 *
 *   1. runs the story on the current branch                -> the "after" frame
 *   2. checks out the PR's changed *source* files from the base ref (default
 *      origin/main), re-runs the SAME story                -> the "before" frame
 *   3. restores the working tree
 *   4. stitches before | after into one labelled PNG (using the already-installed
 *      Playwright — no ImageMagick required)
 *
 * Usage:
 *   node scripts/visual-evidence.mjs --test <path-to.evidence.tsx> [--base origin/main] [--pr <number>]
 *
 * Notes:
 *   - Only works cleanly when the change is a behaviour/markup/style change with a
 *     stable component API (the story must compile against both refs). For API
 *     changes, render before/after variants in one story instead and pass --no-base.
 */
import {execFileSync} from 'node:child_process'
import {existsSync, mkdirSync, readdirSync, readFileSync, rmSync} from 'node:fs'
import path from 'node:path'

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts})
}
function git(args, opts = {}) {
  return sh('git', args, opts).trim()
}

function parseArgs(argv) {
  const args = {base: 'origin/main', test: null, noBase: false, open: false, pr: null}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--test') args.test = argv[++i]
    else if (a === '--base') args.base = argv[++i]
    else if (a === '--no-base') args.noBase = true
    else if (a === '--open') args.open = true
    else if (a === '--pr') args.pr = argv[++i]
  }
  if (!args.test) {
    console.error(
      'Usage: node scripts/visual-evidence.mjs --test <path.evidence.tsx> [--base ref] [--no-base] [--open] [--pr <number>]',
    )
    process.exit(1)
  }
  return args
}

const ASSETS_BRANCH = 'visual-evidence'

// Hosts the PNG on a dedicated assets branch (created off main if missing) and posts
// it as a PR comment. GitHub has no image-upload API for comments, so we commit the
// file via the Contents API and embed its raw URL (which renders inline). The assets
// branch keeps screenshots out of code branches/CI and is safe to delete anytime.
function attachToPr(pr, pngPath) {
  try {
    sh('gh', ['api', `repos/{owner}/{repo}/git/ref/heads/${ASSETS_BRANCH}`])
  } catch {
    const mainSha = git(['rev-parse', 'origin/main'])
    sh('gh', [
      'api',
      '--method',
      'POST',
      'repos/{owner}/{repo}/git/refs',
      '-f',
      `ref=refs/heads/${ASSETS_BRANCH}`,
      '-f',
      `sha=${mainSha}`,
    ])
  }
  const remotePath = `pr-${pr}/before-after.png`
  let existingSha
  try {
    existingSha = sh('gh', [
      'api',
      `repos/{owner}/{repo}/contents/${remotePath}?ref=${ASSETS_BRANCH}`,
      '--jq',
      '.sha',
    ]).trim()
  } catch {
    /* file doesn't exist yet */
  }
  const body = JSON.stringify({
    message: `evidence: PR #${pr} before/after`,
    branch: ASSETS_BRANCH,
    content: readFileSync(pngPath).toString('base64'),
    ...(existingSha ? {sha: existingSha} : {}),
  })
  const res = execFileSync(
    'gh',
    ['api', '--method', 'PUT', `repos/{owner}/{repo}/contents/${remotePath}`, '--input', '-'],
    {encoding: 'utf8', input: body},
  )
  const url = JSON.parse(res).content.download_url
  execFileSync(
    'gh',
    [
      'pr',
      'comment',
      String(pr),
      '--body',
      `### Before / after\n\n![before-after](${url})\n\n<sub>Generated with \`pnpm visual-evidence\` — headless render, no studio/auth/data.</sub>`,
    ],
    {stdio: 'inherit'},
  )
  return url
}

const repoRoot = git(['rev-parse', '--show-toplevel'])
const sanityDir = path.join(repoRoot, 'packages', 'sanity')
const args = parseArgs(process.argv.slice(2))
const testAbs = path.resolve(args.test)
const testDir = path.dirname(testAbs)
const evidenceDir = path.join(testDir, '.visual-evidence')
const outDir = path.join(repoRoot, '.visual-evidence')
mkdirSync(outDir, {recursive: true})

function runStory() {
  // capture the freshest PNG(s): clear the story's evidence dir first
  if (existsSync(evidenceDir)) rmSync(evidenceDir, {recursive: true, force: true})
  const rel = path.relative(sanityDir, testAbs)
  console.log(`  running story: ${rel}`)
  execFileSync(
    'pnpm',
    ['--filter', 'sanity', 'exec', 'vitest', 'run', '-c', 'vitest.evidence.config.mts', rel],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: {...process.env, SANITY_VITEST_BROWSER: 'chromium'},
    },
  )
  if (!existsSync(evidenceDir)) throw new Error(`No screenshot produced in ${evidenceDir}`)
  const pngs = readdirSync(evidenceDir).filter((f) => f.endsWith('.png'))
  if (pngs.length === 0) throw new Error(`No .png written by the story in ${evidenceDir}`)
  return pngs.map((f) => path.join(evidenceDir, f))
}

function changedSourceFiles() {
  const out = git(['diff', '--name-only', `${args.base}...HEAD`])
  return out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((f) => /^packages\/sanity\/src\/.*\.(ts|tsx)$/.test(f))
    .filter((f) => !/\.test\.|\.evidence\.|\/__tests__\/|\/__mocks__\//.test(f))
    .filter((f) => {
      // only files that exist on the base ref (so checkout reverts rather than deletes)
      try {
        git(['cat-file', '-e', `${args.base}:${f}`])
        return true
      } catch {
        return false
      }
    })
}

const toUri = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const col = (label, uri) =>
  uri
    ? `<div class="col"><div class="label">${label}</div><img src="${uri}"/></div>`
    : `<div class="col"><div class="label">${label}</div><div class="missing">(not available)</div></div>`

async function stitch(beforePng, afterPng, outPng) {
  const {chromium} = await import('playwright')
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#f3f3f5;font:600 13px -apple-system,system-ui,sans-serif;color:#52596b}
    .row{display:flex;align-items:flex-start;gap:1px;background:#d5d8e0}
    .col{flex:1;background:#fff;padding:0}
    .label{padding:8px 12px;background:#1b1d28;color:#fff;letter-spacing:.04em;text-transform:uppercase}
    img{display:block;width:100%;height:auto}
    .missing{padding:40px;color:#9aa1b1;text-align:center}
  </style></head><body><div class="row" id="cap">
    ${col('Before · ' + args.base, beforePng ? toUri(beforePng) : null)}
    ${col('After · this branch', afterPng ? toUri(afterPng) : null)}
  </div></body></html>`
  const browser = await chromium.launch()
  const pageCtx = await browser.newPage({
    viewport: {width: 2100, height: 1200},
    deviceScaleFactor: 2,
  })
  await pageCtx.setContent(html, {waitUntil: 'networkidle'})
  await pageCtx.locator('#cap').screenshot({path: outPng})
  await browser.close()
}

const main = async () => {
  console.log(`▶ Visual evidence for ${path.relative(repoRoot, testAbs)}`)
  console.log('• Capturing AFTER (current branch)…')
  const afterPng = runStory()[0]
  const afterSaved = path.join(outDir, 'after.png')
  rmSync(afterSaved, {force: true})
  execFileSync('cp', [afterPng, afterSaved])

  let beforeSaved = null
  if (!args.noBase) {
    const files = changedSourceFiles()
    if (files.length === 0) {
      console.log(
        '• No changed source files vs base — skipping BEFORE (use --no-base for variant stories).',
      )
    } else {
      console.log(
        `• Capturing BEFORE: checking out ${files.length} source file(s) from ${args.base}…`,
      )
      git(['checkout', args.base, '--', ...files])
      try {
        const beforePng = runStory()[0]
        beforeSaved = path.join(outDir, 'before.png')
        rmSync(beforeSaved, {force: true})
        execFileSync('cp', [beforePng, beforeSaved])
      } finally {
        console.log('• Restoring working tree…')
        git(['checkout', 'HEAD', '--', ...files])
      }
    }
  }

  const outPng = path.join(outDir, 'before-after.png')
  console.log('• Stitching side-by-side…')
  await stitch(beforeSaved, afterSaved, outPng)
  // clean the per-story scratch dir
  if (existsSync(evidenceDir)) rmSync(evidenceDir, {recursive: true, force: true})

  console.log(`\n✅ ${path.relative(repoRoot, outPng)}`)
  if (args.pr) {
    console.log(`• Posting to PR #${args.pr}…`)
    const url = attachToPr(args.pr, outPng)
    console.log(`  posted: ${url}`)
  } else {
    console.log('  Re-run with --pr <number> to post it as a PR comment,')
    console.log('  or drag the PNG into the PR (GitHub uploads it on drop).')
  }
  if (args.open) {
    try {
      execFileSync('open', [outPng])
    } catch {
      /* non-macOS or no opener — ignore */
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
