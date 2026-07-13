// oxlint-disable no-console
/** The `bench run` implementation — see ./run.ts for the parser and docs. */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import chalk from 'chalk'

import {EXPERIMENT, REFERENCE} from '../../constants'
import {getBenchTls} from '../../mock-api/tls'
import {
  collectAbInteraction,
  collectAbsoluteInteraction,
  collectPageLoad,
  collectRunMetadata,
} from '../../report/collect'
import {type BenchRunDocument, type ScenarioReport} from '../../report/types'
import {calibrateHost, launchBrowser} from '../../runner/browser'
import {measureBundleSize} from '../../runner/bundleSize'
import {bundleInstrumentation} from '../../runner/inject'
import {runAbScenario} from '../../runner/orchestrator'
import {startSide} from '../../runner/servers'
import {
  type InteractionSessionResult,
  runInteractionSession,
  runSoakSession,
  SessionError,
} from '../../runner/session/interaction'
import {
  type LoadCondition,
  foldLoafAttribution,
  type PageLoadSample,
  runPageLoadSample,
} from '../../runner/session/pageLoad'
import {getScenario, SCENARIOS} from '../../scenarios'
import {bootstrapDiffOfMedians} from '../../stats/bootstrap'
import {gate, PAGELOAD_THRESHOLDS} from '../../stats/gate'
import {summarize} from '../../stats/quantiles'
import {mulberry32} from '../../stats/rng'
import {resolveFromInvocation} from '../benchRoot'
import {type RunArgs} from './run'

const formatEfps = (latencyMs: number) => {
  const efps = 1000 / latencyMs
  if (efps >= 100) return chalk.green('99.9+')
  const rounded = efps.toFixed(1)
  if (efps >= 60) return chalk.green(rounded)
  if (efps >= 20) return chalk.yellow(rounded)
  return chalk.red(rounded)
}

const formatDiff = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}ms`
const VERDICT_ICON = {
  regression: chalk.red('🔴 regression'),
  improvement: chalk.green('🟢 improvement'),
  neutral: chalk.green('✅ neutral'),
  inconclusive: chalk.yellow('⚪ inconclusive'),
} as const

const MAX_CONSECUTIVE_FAILURES = 3

/**
 * Discard-and-retry for sessions outside the A/B orchestrator (absolute and
 * pageLoad modes) — same semantics as runAbScenario's runOne: a failed
 * session is never mixed into results, and repeated failure aborts loudly.
 * (Example residual flake this absorbs: the read-only flip starting in the
 * gap between the editability check and the keydown swallows one keystroke,
 * which the readback validation then rejects.)
 */
async function withSessionRetries<T>(label: string, run: () => Promise<T>): Promise<T> {
  for (let failures = 1; ; failures++) {
    try {
      return await run()
    } catch (error) {
      const reason = error instanceof SessionError ? error.reason : 'unknown'
      const message = error instanceof Error ? error.message : String(error)
      const diagnostics = error instanceof SessionError ? error.diagnostics.slice(0, 5) : []
      if (failures >= MAX_CONSECUTIVE_FAILURES) {
        throw new Error(
          `Aborting ${label}: ${failures} consecutive session failures` +
            (diagnostics.length > 0 ? `\n${diagnostics.join('\n')}` : ''),
          {cause: error},
        )
      }
      console.log(
        chalk.yellow(`  ${label} session failed (${reason}), retrying — ${message.slice(0, 200)}`) +
          (diagnostics.length > 0 ? `\n    ${diagnostics.join('\n    ')}` : ''),
      )
    }
  }
}

export async function runBench(argv: RunArgs): Promise<void> {
  const dist = resolveFromInvocation(argv.dist)
  if (!fs.existsSync(path.join(dist, 'index.html'))) {
    console.error(
      `No studio build at ${dist} — run \`pnpm build:bench\` first (the runner never builds implicitly)`,
    )
    process.exit(1)
  }

  const scenarios = argv.scenario.length
    ? argv.scenario.map((name) => getScenario(name))
    : SCENARIOS

  const referenceDist = argv.referenceDist ? resolveFromInvocation(argv.referenceDist) : undefined
  if (referenceDist && !fs.existsSync(path.join(referenceDist, 'index.html'))) {
    console.error(`No studio build at ${referenceDist}`)
    process.exit(1)
  }

  const instrumentation = await bundleInstrumentation()
  const running = await startSide(EXPERIMENT, dist)
  const reference = referenceDist ? await startSide(REFERENCE, referenceDist) : undefined
  const browser = await launchBrowser(!argv.headed, (await getBenchTls()).spki)

  const startedAt = new Date().toISOString()
  const scenarioReports: ScenarioReport[] = []
  let bundleReport: BenchRunDocument['bundle']

  try {
    const calibration = await calibrateHost(browser)
    console.log(
      `host calibration: ${calibration.toFixed(0)}ms (fixed workload; higher = slower host), CPU throttle: ${argv.throttle}x` +
        `${reference ? `, mode: A/B (seed ${argv.seed})` : ', mode: absolute'}`,
    )
    const runMetadata = collectRunMetadata({
      mode: reference ? 'ab' : 'absolute',
      calibrationMs: calibration,
      cpuThrottleRate: argv.throttle,
      seed: argv.seed,
      startedAt,
    })

    if (argv.mode === 'soak') {
      for (const scenario of scenarios) {
        console.log(`\n${chalk.cyan(scenario.name)} — soak, ${argv.minutes} minute(s)`)
        const soak = await runSoakSession({
          browser,
          running,
          scenario,
          instrumentation,
          minutes: argv.minutes,
          config: {cpuThrottleRate: argv.throttle},
          log: (message) => console.log(message),
        })
        const first = soak.samples[0]
        const last = soak.samples.at(-1)
        if (first && last) {
          console.log(
            `  heap ${first.heapMb.toFixed(1)} → ${last.heapMb.toFixed(1)} MB, ` +
              `nodes ${first.domNodes} → ${last.domNodes}, listeners ${first.listeners} → ${last.listeners}`,
          )
        }
        scenarioReports.push({
          scenario: scenario.name,
          sourceFile: scenario.sourceFile,
          kind: 'interaction',
          metrics: [],
          failures: [],
          interruptions: {experiment: soak.interruptions},
          loafAttribution: [],
          soak: {minutes: soak.minutes, samples: soak.samples},
        })
      }
    } else if (argv.mode === 'pageload') {
      const sizes = await measureBundleSize(dist)
      console.log(
        `bundle (experiment): initial JS ${(sizes.initialJsBytes / 1024).toFixed(1)} KB gzip, ` +
          `total ${(sizes.totalJsBytes / 1024).toFixed(1)} KB gzip across ${sizes.chunkCount} chunks`,
      )
      bundleReport = {experiment: sizes}
      if (referenceDist) {
        const referenceSizes = await measureBundleSize(referenceDist)
        bundleReport = {experiment: sizes, reference: referenceSizes}
        console.log(
          `bundle (reference):  initial JS ${(referenceSizes.initialJsBytes / 1024).toFixed(1)} KB gzip ` +
            `(Δ ${((sizes.initialJsBytes - referenceSizes.initialJsBytes) / 1024).toFixed(1)} KB), ` +
            `total ${(referenceSizes.totalJsBytes / 1024).toFixed(1)} KB gzip ` +
            `(Δ ${((sizes.totalJsBytes - referenceSizes.totalJsBytes) / 1024).toFixed(1)} KB)`,
        )
      }

      for (const scenario of scenarios) {
        console.log(`\n${chalk.cyan(scenario.name)} — pageLoad, ${argv.sessions} samples/side`)
        const bySide = new Map<string, PageLoadSample[]>()
        const sides: {name: 'reference' | 'experiment'; side: typeof running}[] = reference
          ? [
              {name: 'reference', side: reference},
              {name: 'experiment', side: running},
            ]
          : [{name: 'experiment', side: running}]

        for (let i = 0; i < argv.sessions; i++) {
          // Alternate which side samples first each pair so a monotonic host
          // trend (thermal throttle, background load decay) can't land on the
          // same side of every pair (same rationale as runAbScenario's rounds)
          const ordered = i % 2 === 0 ? sides : sides.toReversed()
          for (const {name, side} of ordered) {
            const samples = await withSessionRetries(`${scenario.name} ${name}`, () =>
              runPageLoadSample({
                browser,
                running: side,
                scenario,
                instrumentation,
                config: {
                  cpuThrottleRate: argv.throttle,
                  ...(argv.networkEmulation ? {} : {network: null}),
                },
              }),
            )
            bySide.set(name, [...(bySide.get(name) ?? []), ...samples])
            console.log(
              `  sample ${i + 1}/${argv.sessions} ${name}: ` +
                samples
                  .map(
                    (sample) =>
                      `${sample.condition} time-to-editable ${sample.timeToEditableMs.toFixed(0)}ms`,
                  )
                  .join(', '),
            )
          }
        }

        const conditionComparisons = new Map<
          LoadCondition,
          {interval: ReturnType<typeof bootstrapDiffOfMedians>; verdict: ReturnType<typeof gate>}
        >()
        for (const condition of ['boot-cold', 'open-doc-warm'] as LoadCondition[]) {
          const experimentSamples = (bySide.get('experiment') ?? []).filter(
            (sample) => sample.condition === condition,
          )
          const stats = summarize(experimentSamples.map((sample) => sample.timeToEditableMs))
          console.log(
            `  ${chalk.bold(condition)} (experiment): time-to-editable p50 ${stats.median.toFixed(0)}ms, ` +
              `fcp p50 ${summarize(experimentSamples.map((s) => s.fcpMs ?? 0)).median.toFixed(0)}ms, ` +
              `lcp p50 ${summarize(experimentSamples.map((s) => s.lcpMs ?? 0)).median.toFixed(0)}ms, ` +
              `cls p50 ${summarize(experimentSamples.map((s) => s.cls)).median.toFixed(3)}, ` +
              `blocking p50 ${summarize(experimentSamples.map((s) => s.blockingMs)).median.toFixed(0)}ms`,
          )
          console.log(
            `  ${chalk.bold(condition)} auth: ${summarize(experimentSamples.map((s) => s.auth.trips)).median.toFixed(0)} round trip(s) before editable, ` +
              `first request p50 ${summarize(experimentSamples.map((s) => s.auth.firstRequestMs ?? 0)).median.toFixed(0)}ms, ` +
              `in flight p50 ${summarize(experimentSamples.map((s) => s.auth.inFlightMs)).median.toFixed(0)}ms`,
          )
          const blockers = foldLoafAttribution(
            experimentSamples.map((s) => ({
              scripts: s.loafAttribution.map((script) => ({...script, duration: script.totalMs})),
            })),
            3,
          )
          if (blockers.length > 0) {
            console.log(
              `  ${chalk.bold(condition)} top blockers: ` +
                blockers
                  .map(
                    (script) =>
                      `${script.sourceUrl.split('/').at(-1) || '(inline)'}#${script.functionName || '(anonymous)'} ${(script.totalMs / experimentSamples.length).toFixed(0)}ms/sample`,
                  )
                  .join(', '),
            )
          }
          const referenceSamples = (bySide.get('reference') ?? []).filter(
            (sample) => sample.condition === condition,
          )
          if (referenceSamples.length > 0) {
            const interval = bootstrapDiffOfMedians({
              aSessions: referenceSamples.map((sample) => [sample.timeToEditableMs]),
              bSessions: experimentSamples.map((sample) => [sample.timeToEditableMs]),
              rng: mulberry32(argv.seed),
            })
            const referenceMedian = summarize(
              referenceSamples.map((s) => s.timeToEditableMs),
            ).median
            const verdict = gate(interval, referenceMedian, PAGELOAD_THRESHOLDS)
            conditionComparisons.set(condition, {interval, verdict})
            console.log(
              `  ${chalk.bold(condition)} time-to-editable: reference ${referenceMedian.toFixed(0)}ms → ` +
                `Δ ${formatDiff(interval.diff)} [${formatDiff(interval.lo)}, ${formatDiff(interval.hi)}] ${VERDICT_ICON[verdict]}`,
            )
          }
        }
        scenarioReports.push(
          collectPageLoad(scenario.name, bySide, conditionComparisons, scenario.sourceFile),
        )
      }
    } else {
      for (const scenario of scenarios) {
        if (reference) {
          console.log(`\n${chalk.cyan(scenario.name)} — A/B interleaved, dynamic stopping`)
          const result = await runAbScenario({
            browser,
            scenario,
            reference,
            experiment: running,
            instrumentation,
            rng: mulberry32(argv.seed),
            config: {
              minSessionsPerSide: argv.sessions,
              maxSessionsPerSide: argv.maxSessions,
              budgetMs: argv.budget * 1000,
              sessionConfig: {cpuThrottleRate: argv.throttle},
            },
            log: (message) => console.log(message),
          })
          for (const comparison of result.comparisons) {
            console.log(
              `  ${chalk.bold(comparison.label)}: reference ${comparison.referenceMedian.toFixed(0)}ms → experiment ${comparison.experimentMedian.toFixed(0)}ms — ` +
                `Δ ${formatDiff(comparison.interval.diff)} [${formatDiff(comparison.interval.lo)}, ${formatDiff(comparison.interval.hi)}] ${VERDICT_ICON[comparison.verdict]}`,
            )
          }
          console.log(
            `  stopped by: ${result.stoppedBy} (${result.reference.sessions.length}+${result.experiment.sessions.length} sessions, ${result.failures.length} retried failure(s))`,
          )
          scenarioReports.push(collectAbInteraction(result, scenario.sourceFile))
          continue
        }
        console.log(`\n${chalk.cyan(scenario.name)} — ${argv.sessions} sessions`)
        const results: InteractionSessionResult[] = []
        for (let i = 0; i < argv.sessions; i++) {
          const started = Date.now()
          const result = await withSessionRetries(scenario.name, () =>
            runInteractionSession({
              browser,
              running,
              scenario,
              instrumentation,
              config: {cpuThrottleRate: argv.throttle},
            }),
          )
          results.push(result)
          const medians = result.fields
            .map((field) => `${field.label}: ${summarize(field.samples).median.toFixed(0)}ms`)
            .join(', ')
          console.log(
            `  session ${i + 1}/${argv.sessions} (${((Date.now() - started) / 1000).toFixed(1)}s) — ${medians}` +
              `${result.timeToEditableMs === null ? '' : `, time-to-editable ${result.timeToEditableMs.toFixed(0)}ms`}` +
              `${result.readOnlyInterruptions.count === 0 ? '' : chalk.yellow(`, ${result.readOnlyInterruptions.count} read-only interruption(s) (${result.readOnlyInterruptions.totalMs.toFixed(0)}ms)`)}`,
          )
        }

        // Pooled summary per field (Phase 3 replaces pooling with per-session
        // cluster bootstrap)
        for (const field of results[0].fields.map((f) => f.label)) {
          const samples = results.flatMap(
            (result) => result.fields.find((f) => f.label === field)?.samples ?? [],
          )
          const burst = results.flatMap(
            (result) => result.fields.find((f) => f.label === field)?.burstSamples ?? [],
          )
          const belowFloor = results.reduce(
            (sum, result) =>
              sum + (result.fields.find((f) => f.label === field)?.belowFloorCount ?? 0),
            0,
          )
          const stats = summarize(samples)
          const burstStats = summarize(burst)
          console.log(
            `  ${chalk.bold(field)}: ${formatEfps(stats.median)} eFPS — ` +
              `p50 ${stats.median.toFixed(0)}ms, p75 ${stats.p75.toFixed(0)}ms, ` +
              `p90 ${stats.p90.toFixed(0)}ms, p99 ${stats.p99.toFixed(0)}ms ` +
              `(${stats.n} keystrokes, ${belowFloor} below 16ms floor) | ` +
              `burst p50 ${burstStats.median.toFixed(0)}ms`,
          )
        }
        const timeToEditableValues = results
          .map((result) => result.timeToEditableMs)
          .filter((value): value is number => value !== null)
        if (timeToEditableValues.length > 0) {
          console.log(
            `  time-to-editable: p50 ${summarize(timeToEditableValues).median.toFixed(0)}ms across ${timeToEditableValues.length} sessions | ` +
              `blocking p50 ${summarize(results.map((r) => r.blockingMs)).median.toFixed(0)}ms`,
          )
        }
        scenarioReports.push(
          collectAbsoluteInteraction(scenario.name, results, scenario.sourceFile),
        )
      }
    }

    const runDocument: BenchRunDocument = {
      ...runMetadata,
      completedAt: new Date().toISOString(),
      scenarios: scenarioReports,
      ...(bundleReport ? {bundle: bundleReport} : {}),
    }
    if (argv.jsonOut) {
      const outPath = resolveFromInvocation(argv.jsonOut)
      fs.mkdirSync(path.dirname(outPath), {recursive: true})
      fs.writeFileSync(outPath, JSON.stringify(runDocument, null, 2))
      console.log(`\nwrote ${outPath}`)
    }
    if (argv.failOnVerdict) {
      const nonNeutral = scenarioReports
        .flatMap((scenarioReport) => scenarioReport.metrics)
        .filter((metric) => metric.comparison && metric.comparison.verdict !== 'neutral')
      if (nonNeutral.length > 0) {
        console.error(
          `fail-on-verdict: ${nonNeutral.length} non-neutral comparison(s): ` +
            nonNeutral.map((metric) => `${metric.label}=${metric.comparison?.verdict}`).join(', '),
        )
        process.exitCode = 1
      }
    }
  } finally {
    await browser.close()
    await running.close()
    await reference?.close()
  }
}
