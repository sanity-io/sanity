// oxlint-disable no-console
import {execFileSync} from 'node:child_process'
import * as fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {BENCH_ROOT} from '../cli/benchRoot'
import {getBenchTls} from '../mock-api/tls'
import {launchBrowser} from '../runner/browser'
import {analyze, type ExportCost, type StepScope, studioImports} from './analyze'
import {buildCdnBundle, type CdnBuild} from './cdnBuild'
import {MODULE_HOST_URL} from './moduleHost'
import {formatReport, pickVerifications} from './report'
import {type ByteSizes, fileSizes} from './sizes'
import {measureSteps, type StepName, STEP_NAMES, type StepsResult} from './steps'

export interface StepTotals {
  cdn: ByteSizes
  studio: ByteSizes
  cdnFiles: number
}

export interface RemovedExport {
  entry: string
  name: string
}

export interface Verification {
  /** Exports dropped from their entries together for this rebuild. */
  removed: RemovedExport[]
  /** Static prediction, brotli bytes summed over the removed exports: upper and lower bound. */
  predicted: Partial<Record<StepName, {exclusive: number; leavesBuild: number}>>
  /** Per step: JS bytes the step loads without the export, minus with it (the median run). */
  delta: Partial<Record<StepName, ByteSizes>>
  /** Per step: the brotli delta of every run against the baseline median. */
  runs: Partial<Record<StepName, number[]>>
  errors: string[]
}

export interface ExportCostReport {
  generatedAt: string
  commit: string
  branch: string
  /** Minified bytes the build ships over the per-module minified sum (see ModuleSizes). */
  calibration: number
  scopes: Partial<Record<StepName, StepScope>>
  /** The median run per step. */
  totals: Partial<Record<StepName, StepTotals>>
  /** Per step: CDN JS brotli bytes of every baseline run. */
  totalsRuns: Partial<Record<StepName, number[]>>
  /** How many times the baseline and each rebuild were measured. */
  repeat: number
  entryExports: Record<string, number>
  costs: ExportCost[]
  verifications: Verification[]
}

export interface RunOptions {
  outDir: string
  /**
   * How many of the costliest exports to remove one at a time, rebuild and measure end to end
   * (then all of them at once).
   */
  verify: number
  /** Extra `entry:name` exports to verify. */
  verifyNames: string[]
  /** Measure the baseline and each rebuild this many times, to show run-to-run noise. */
  repeat: number
  headless: boolean
  /** Rows per entry in the markdown tables. */
  top: number
}

function git(args: string[]): string {
  return execFileSync('git', args, {cwd: BENCH_ROOT, encoding: 'utf8'}).trim()
}

/** The bench studio built as `autoUpdates: true`, loading `sanity` from the local module host. */
function buildAutoUpdatingStudio(dir: string): void {
  execFileSync(path.join(BENCH_ROOT, 'node_modules/.bin/sanity'), ['build', dir, '-y'], {
    cwd: BENCH_ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
    env: {
      ...process.env,
      SANITY_BENCH_AUTO_UPDATES: 'true',
      SANITY_MODULES_HOST: MODULE_HOST_URL,
    },
  })
}

function scopeOf(cdn: CdnBuild, files: string[]): StepScope {
  const entryFiles = new Map(Object.keys(cdn.entries).map((entry) => [`${entry}.mjs`, entry]))
  return {
    entries: files.flatMap((file) => entryFiles.get(file) ?? []).toSorted(),
    lazyChunks: files.filter((file) => file.endsWith('.mjs') && !entryFiles.has(file)),
  }
}

function sum(sizes: ByteSizes[]): ByteSizes {
  return sizes.reduce(
    (total, size) => ({
      raw: total.raw + size.raw,
      minified: total.minified + size.minified,
      gzip: total.gzip + size.gzip,
      brotli: total.brotli + size.brotli,
    }),
    {raw: 0, minified: 0, gzip: 0, brotli: 0},
  )
}

/** JS bytes per step, each file compressed on its own as a CDN serves it. */
function stepTotals(
  result: StepsResult,
  cdnDir: string,
  studioDir: string,
  cache: Map<string, ByteSizes>,
): Partial<Record<StepName, StepTotals>> {
  const measure = (file: string) => {
    let size = cache.get(file)
    if (!size) {
      size = fileSizes(fs.readFileSync(file))
      cache.set(file, size)
    }
    return size
  }
  const totals: Partial<Record<StepName, StepTotals>> = {}
  for (const step of STEP_NAMES) {
    const files = result.steps[step]
    if (!files) continue
    const cdnJs = files.cdn.filter((file) => file.endsWith('.mjs'))
    totals[step] = {
      cdn: sum(cdnJs.map((file) => measure(path.join(cdnDir, file)))),
      studio: sum(files.studio.map((file) => measure(path.join(studioDir, file)))),
      cdnFiles: cdnJs.length,
    }
  }
  return totals
}

/** Measures the steps `repeat` times and keeps, per step, the run with the median CDN JS. */
async function measureRepeatedly(
  options: {studioDir: string; cdnDir: string; browser: Awaited<ReturnType<typeof launchBrowser>>},
  repeat: number,
): Promise<{
  first: StepsResult
  totals: Partial<Record<StepName, StepTotals>>
  runs: Partial<Record<StepName, number[]>>
  errors: string[]
}> {
  const cache = new Map<string, ByteSizes>()
  const results: StepsResult[] = []
  for (let run = 0; run < repeat; run++) results.push(await measureSteps(options))
  const perRun = results.map((result) =>
    stepTotals(result, options.cdnDir, options.studioDir, cache),
  )
  const totals: Partial<Record<StepName, StepTotals>> = {}
  const runs: Partial<Record<StepName, number[]>> = {}
  for (const step of STEP_NAMES) {
    const measured = perRun.flatMap((each) => each[step] ?? [])
    if (measured.length === 0) continue
    const sorted = measured.toSorted((a, b) => a.cdn.brotli - b.cdn.brotli)
    totals[step] = sorted[Math.floor((sorted.length - 1) / 2)]
    runs[step] = measured.map((each) => each.cdn.brotli)
  }
  return {
    first: results[0],
    totals,
    runs,
    errors: [...new Set(results.flatMap((result) => result.errors))],
  }
}

function delta(after: ByteSizes, before: ByteSizes): ByteSizes {
  return {
    raw: after.raw - before.raw,
    minified: after.minified - before.minified,
    gzip: after.gzip - before.gzip,
    brotli: after.brotli - before.brotli,
  }
}

export async function runExportCosts(options: RunOptions): Promise<ExportCostReport> {
  const outDir = path.resolve(options.outDir)
  fs.mkdirSync(outDir, {recursive: true})
  const cdnDir = path.join(outDir, 'cdn')
  const studioDir = path.join(outDir, 'studio')

  console.log('Building the CDN bundle (packages/sanity/package.bundle.ts)…')
  const cdn = await buildCdnBundle({outDir: cdnDir})
  console.log('Building the auto-updating bench studio…')
  buildAutoUpdatingStudio(studioDir)

  const tls = await getBenchTls()
  const browser = await launchBrowser(options.headless, tls.spki)
  try {
    console.log(`Measuring what each step loads (${options.repeat}×)…`)
    const measured = await measureRepeatedly({studioDir, cdnDir, browser}, options.repeat)
    const base = {...measured.first, errors: measured.errors}
    if (base.errors.length > 0 || !base.steps.login || !base.steps.authenticated) {
      throw new Error(`The auto-updating studio did not boot:\n${base.errors.join('\n')}`)
    }
    const scopes: Partial<Record<StepName, StepScope>> = {
      login: scopeOf(cdn, base.steps.login.cdn),
      authenticated: scopeOf(cdn, base.steps.authenticated.cdn),
    }

    console.log('Attributing bytes to exports…')
    const analysis = await analyze({cdn, scopes, studioImports: studioImports(studioDir)})
    const totals = measured.totals

    const candidates = pickVerifications(analysis.costs, options.verify, options.verifyNames)
    const runs = candidates.map((candidate) => [candidate])
    if (candidates.length > 1) runs.push(candidates)
    const verifications: Verification[] = []
    for (const [index, removed] of runs.entries()) {
      const label = removed.map((cost) => `${cost.entry}:${cost.name}`).join(', ')
      console.log(`Verifying ${index + 1}/${runs.length}: rebuild without ${label}…`)
      const dir = path.join(outDir, 'verify', String(index))
      const entries = [...new Set(removed.map((cost) => cost.entry))]
      await buildCdnBundle({
        outDir: dir,
        overrides: entries.map((entry) => ({
          entry,
          except: removed.filter((cost) => cost.entry === entry).map((cost) => cost.name),
          exports: analysis.entryExports[entry] ?? [],
        })),
      })
      const result = await measureRepeatedly({studioDir, cdnDir: dir, browser}, options.repeat)
      const verification: Verification = {
        removed: removed.map(({entry, name}) => ({entry, name})),
        predicted: {},
        delta: {},
        runs: {},
        errors: result.errors,
      }
      for (const step of STEP_NAMES) {
        const before = totals[step]
        const now = result.totals[step]
        if (before && now) {
          verification.delta[step] = delta(now.cdn, before.cdn)
          verification.runs[step] = (result.runs[step] ?? []).map(
            (brotli) => brotli - before.cdn.brotli,
          )
        }
        const scoped = step === 'afterLogin' ? 'authenticated' : step
        verification.predicted[step] = {
          exclusive: removed.reduce(
            (total, cost) => total + (cost.steps[scoped]?.exclusive.brotli ?? 0),
            0,
          ),
          leavesBuild: removed.reduce(
            (total, cost) => total + (cost.steps[scoped]?.leavesBuild.brotli ?? 0),
            0,
          ),
        }
      }
      verifications.push(verification)
      fs.rmSync(dir, {recursive: true, force: true})
    }

    const report: ExportCostReport = {
      generatedAt: new Date().toISOString(),
      commit: git(['rev-parse', 'HEAD']),
      branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
      calibration: analysis.sizes.calibration,
      scopes,
      totals,
      totalsRuns: measured.runs,
      repeat: options.repeat,
      entryExports: Object.fromEntries(
        Object.entries(analysis.entryExports).map(([entry, names]) => [entry, names.length]),
      ),
      costs: analysis.costs,
      verifications,
    }
    fs.writeFileSync(path.join(outDir, 'export-costs.json'), `${JSON.stringify(report, null, 2)}\n`)
    fs.writeFileSync(path.join(outDir, 'export-costs.md'), formatReport(report, options.top))
    console.log(`Wrote ${path.join(outDir, 'export-costs.md')} and export-costs.json`)
    return report
  } finally {
    await browser.close()
  }
}
