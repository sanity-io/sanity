/**
 * Compares Sanity Studio v6 (`main`) with v7 (`next-major`) on one minimal studio built in
 * production mode from each ref, served locally and measured with Playwright + Chromium:
 *
 *   pnpm perf:version-compare --runs 15 --out version-compare.json
 *
 * The studios are served over HTTP/2 with TLS like a CDN does (--http-version 1.1 serves plain
 * HTTP/1.1, whose six connections per host and per-request latency overstate the cost of many
 * small chunks). Load times are measured under emulated network and CPU conditions (--network, --cpu-throttle;
 * `slow-4g` and `fast-4g` by default), each sample in a fresh context with the HTTP cache off.
 *
 * One more load of the authenticated `/404` page (the login page with --skip-authenticated) per
 * version and profile records a Chrome trace and the CDP network log, both cut off at ready, into
 * --trace-dir. That load is kept out of the timings: the job summary and the JSON report get its
 * request waterfall (serial request chain, bytes and request count before ready) and the main
 * thread's time split into parse/compile, script and render.
 *
 * Each ref is checked out into its own git worktree under --work-dir, so the run never touches
 * the working tree it started from. The authenticated metric uses the same token mechanism as
 * the e2e suite (SANITY_E2E_SESSION_TOKEN, SANITY_E2E_PROJECT_ID, SANITY_E2E_DATASET against
 * staging); without them pass --skip-authenticated to measure the rest.
 */
import {appendFile, mkdir, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'

import {chromium, type Browser} from '@playwright/test'

import {readEnv} from '../../envVars'
import {prepareVersion, type BuiltVersion} from './build'
import {measureBuild, measureRequested, type JsSize} from './bundleSize'
import {takeSample, type ReadyKind} from './measure'
import {
  compareMetric,
  renderSummary,
  type ComparisonReport,
  type MetricComparison,
  type ProfileResult,
  type VersionInfo,
} from './report'
import {startStaticServer, type HttpVersion} from './server'
import {isProfileName, PROFILES, type ProfileName, type ThrottleProfile} from './throttle'
import {mainThreadTasks, mainThreadTime} from './trace'
import {buildWaterfall, countBytes, type ByteCount, type Waterfall} from './waterfall'

// `pnpm --filter` runs the script from e2e/, so relative paths resolve against where pnpm was run.
const INVOKED_FROM = process.env.INIT_CWD ?? process.cwd()
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const API_HOST = 'https://api.sanity.work'
// With HTTP/1.1 the studio is reached at the e2e studio's own origin, which the project allows.
const DEFAULT_PORT = 3339

type Side = 'v6' | 'v7'

function parseOptions() {
  const {values} = parseArgs({
    options: {
      'cpu-throttle': {type: 'string'},
      'http-version': {default: '2', type: 'string'},
      'network': {default: 'slow-4g,fast-4g', type: 'string'},
      'out': {default: 'version-compare.json', type: 'string'},
      'port': {default: String(DEFAULT_PORT), type: 'string'},
      'reuse-builds': {default: false, type: 'boolean'},
      'runs': {default: '15', type: 'string'},
      'skip-authenticated': {default: false, type: 'boolean'},
      'trace-dir': {type: 'string'},
      'v6-ref': {default: 'main', type: 'string'},
      'v7-ref': {default: 'next-major', type: 'string'},
      'work-dir': {default: path.join(os.tmpdir(), 'studio-version-compare'), type: 'string'},
    },
  })
  const runs = Number(values.runs)
  if (!Number.isInteger(runs) || runs < 1) throw new Error('--runs must be a positive integer')
  if (values['http-version'] !== '1.1' && values['http-version'] !== '2') {
    throw new Error('--http-version must be 1.1 or 2')
  }
  const httpVersion: HttpVersion = values['http-version']
  const names = values.network.split(',').map((name) => name.trim())
  const unknown = names.filter((name) => !isProfileName(name))
  if (unknown.length > 0 || names.length === 0) {
    throw new Error(`--network takes a comma separated list of ${Object.keys(PROFILES).join(', ')}`)
  }
  const cpuOverride =
    values['cpu-throttle'] === undefined ? undefined : Number(values['cpu-throttle'])
  if (cpuOverride !== undefined && !(cpuOverride >= 1)) {
    throw new Error('--cpu-throttle must be a number of at least 1')
  }
  const profiles = names.filter(isProfileName).map((name) => {
    const preset: ThrottleProfile = PROFILES[name]
    return {name, throttle: {...preset, cpuThrottle: cpuOverride ?? preset.cpuThrottle}}
  })
  const out = path.resolve(INVOKED_FROM, values.out)
  return {
    httpVersion,
    out,
    profiles,
    port: Number(values.port),
    reuse: values['reuse-builds'],
    runs,
    skipAuthenticated: values['skip-authenticated'],
    traceDir: values['trace-dir']
      ? path.resolve(INVOKED_FROM, values['trace-dir'])
      : path.join(path.dirname(out), 'version-compare-traces'),
    v6Ref: values['v6-ref'],
    v7Ref: values['v7-ref'],
    workDir: path.resolve(INVOKED_FROM, values['work-dir']),
  }
}

interface NamedProfile {
  name: ProfileName
  throttle: ThrottleProfile
}

function versionInfo(built: BuiltVersion): VersionInfo {
  return {ref: built.ref, sanityVersion: built.sanityVersion, sha: built.sha}
}

async function main(): Promise<void> {
  const options = parseOptions()
  const authenticated = !options.skipAuthenticated
  const projectId = readEnv('SANITY_E2E_PROJECT_ID')
  const dataset = readEnv('SANITY_E2E_DATASET')
  const token = authenticated ? readEnv('SANITY_E2E_SESSION_TOKEN') : undefined

  await mkdir(options.workDir, {recursive: true})
  await mkdir(options.traceDir, {recursive: true})
  const builds = {} as Record<Side, BuiltVersion>
  for (const [side, ref] of [
    ['v6', options.v6Ref],
    ['v7', options.v7Ref],
  ] as const) {
    console.log(`\n== Building ${side} from ${ref}`)
    // oxlint-disable-next-line no-await-in-loop -- builds share the CPU, so run one at a time
    builds[side] = await prepareVersion({
      ref,
      repoRoot: REPO_ROOT,
      reuse: options.reuse,
      studio: {apiHost: API_HOST, dataset, projectId},
      workDir: options.workDir,
    })
  }

  const server = await startStaticServer({
    certDir: path.join(options.workDir, 'certs'),
    httpVersion: options.httpVersion,
    port: options.port,
  })
  const browser: Browser = await chromium.launch({args: server.browserArgs})
  const sides: Side[] = ['v6', 'v7']

  try {
    const initialJs: Partial<Record<Side, JsSize>> = {}
    const timings = new Map<
      string,
      {login: Record<Side, number[]>; tools: Record<Side, number[]>}
    >()
    // JS received before ready, per sample, next to the timings of the same loads.
    const jsBytes = new Map<string, Record<ReadyKind, Record<Side, ByteCount[]>>>()
    const waterfalls = new Map<string, Partial<Record<Side, Waterfall>>>()
    const pagePath = (kind: ReadyKind) => (kind === 'tools' ? '/404' : '/')

    const sample = (kind: ReadyKind, side: Side, profile: NamedProfile, trace: boolean) => {
      server.setRoot(builds[side].distDir)
      return takeSample({
        auth: kind === 'tools' && token ? {projectId, token} : undefined,
        browser,
        kind,
        path: pagePath(kind),
        throttle: profile.throttle,
        trace,
        url: server.url,
      })
    }

    const measure = async (kind: ReadyKind, side: Side, profile: NamedProfile, record: boolean) => {
      const result = await sample(kind, side, profile, false)
      if (!record) return
      timings.get(profile.name)![kind][side].push(result.readyMs)
      jsBytes.get(profile.name)![kind][side].push(countBytes(result.network.requests, ['js']))
      // The files a cold load fetches do not depend on how fast the network is.
      initialJs[side] ??= await measureRequested(builds[side].distDir, result.scriptPaths)
    }

    const traceLoad = async (kind: ReadyKind, side: Side, profile: NamedProfile) => {
      const result = await sample(kind, side, profile, true)
      const name = `${profile.name}-${side}-${kind}`
      const files = {network: `${name}.network.json`, trace: `${name}.trace.json`}
      const {events, window} = result.trace!
      await writeFile(
        path.join(options.traceDir, files.trace),
        JSON.stringify({traceEvents: events}),
      )
      await writeFile(
        path.join(options.traceDir, files.network),
        JSON.stringify({readyMs: result.readyMs, ...result.network}, null, 1),
      )
      const waterfall = buildWaterfall({
        files,
        mainThread: window ? mainThreadTime(events, window) : null,
        path: pagePath(kind),
        readyMs: result.readyMs,
        requests: result.network.requests,
        tasks: window ? mainThreadTasks(events, window) : [],
      })
      waterfalls.get(profile.name)![side] = waterfall
    }

    // One discarded pass per side, metric and profile warms DNS, TLS, the API's own caches and the
    // server's compressed copies. After that the sides alternate within every run, so slow drift
    // of the machine hits both equally.
    const kinds: ReadyKind[] = authenticated ? ['login', 'tools'] : ['login']
    const tracedKind: ReadyKind = authenticated ? 'tools' : 'login'
    for (const profile of options.profiles) {
      timings.set(profile.name, {login: {v6: [], v7: []}, tools: {v6: [], v7: []}})
      jsBytes.set(profile.name, {login: {v6: [], v7: []}, tools: {v6: [], v7: []}})
      waterfalls.set(profile.name, {})
      for (const kind of kinds) {
        for (const side of sides) {
          // oxlint-disable-next-line no-await-in-loop -- samples must not overlap
          await measure(kind, side, profile, false)
        }
        for (let run = 1; run <= options.runs; run++) {
          // The first side flips every run so neither one always goes first.
          for (const side of run % 2 ? sides : sides.toReversed()) {
            // oxlint-disable-next-line no-await-in-loop -- samples must not overlap
            await measure(kind, side, profile, true)
          }
          console.log(`${profile.name} ${kind}: run ${run}/${options.runs}`)
        }
        if (kind !== tracedKind) continue
        for (const side of sides) {
          // oxlint-disable-next-line no-await-in-loop -- samples must not overlap
          await traceLoad(kind, side, profile)
        }
        console.log(`${profile.name} ${kind}: traced`)
      }
    }

    const fullBuild: Record<Side, JsSize> = {
      v6: await measureBuild(builds.v6.distDir),
      v7: await measureBuild(builds.v7.distDir),
    }
    const initial = {v6: initialJs.v6!, v7: initialJs.v7!}

    const metrics: Record<string, MetricComparison> = {}
    for (const key of ['raw', 'gzip', 'brotli'] as const) {
      metrics[`jsBundle.${key}`] = compareMetric(
        `Total JS emitted by the build (${key})`,
        'bytes',
        [fullBuild.v6[key]],
        [fullBuild.v7[key]],
      )
    }
    for (const key of ['raw', 'gzip', 'brotli'] as const) {
      metrics[`initialJs.${key}`] = compareMetric(
        `JS downloaded by the login page (${key})`,
        'bytes',
        [initial.v6[key]],
        [initial.v7[key]],
      )
    }

    const profiles: Record<string, ProfileResult> = {}
    const readyDescriptions: Record<ReadyKind, string> = {
      login: 'Login page: navigation to login screen interactive, unauthenticated',
      tools: '`/404` tool page: navigation to navbar tool list, authenticated',
    }
    const pageLabels: Record<ReadyKind, string> = {login: 'Login page', tools: '`/404` tool page'}
    for (const {name, throttle} of options.profiles) {
      const ready = timings.get(name)!
      const bytes = jsBytes.get(name)!
      const profileMetrics: Record<string, MetricComparison> = {}
      for (const kind of kinds) {
        profileMetrics[`${kind}Ready`] = compareMetric(
          readyDescriptions[kind],
          'ms',
          ready[kind].v6,
          ready[kind].v7,
        )
        for (const [key, label] of [
          ['transferBytes', 'transferred'],
          ['decodedBytes', 'decoded'],
        ] as const) {
          profileMetrics[`${kind}Js.${key}`] = compareMetric(
            `${pageLabels[kind]}: JS received before ready, ${label}`,
            'bytes',
            bytes[kind].v6.map((count) => count[key]),
            bytes[kind].v7.map((count) => count[key]),
          )
        }
      }
      const traced = waterfalls.get(name)!
      profiles[name] = {
        cacheDisabled: true,
        cpuThrottle: throttle.cpuThrottle,
        metrics: profileMetrics,
        network: throttle.network ? {...throttle.network} : null,
        ...(traced.v6 && traced.v7 ? {waterfall: {v6: traced.v6, v7: traced.v7}} : {}),
      }
    }

    const report: ComparisonReport = {
      environment: {
        browser: `chromium ${browser.version()}`,
        cpus: os.cpus().length,
        cpuModel: os.cpus()[0]?.model ?? 'unknown',
        ci: process.env.CI === 'true',
        node: process.version,
        os: `${os.platform()} ${os.release()}`,
        httpVersion: options.httpVersion === '2' ? 'HTTP/2 (TLS)' : 'HTTP/1.1',
        profiles: options.profiles.map((profile) => profile.name).join(','),
        runs: options.runs,
        staticServerCompression: 'brotli',
        totalMemoryGiB: Math.round(os.totalmem() / 1024 ** 3),
      },
      generatedAt: new Date().toISOString(),
      metrics,
      profiles,
      schemaVersion: 3,
      versions: {v6: versionInfo(builds.v6), v7: versionInfo(builds.v7)},
    }

    await mkdir(path.dirname(options.out), {recursive: true})
    await writeFile(options.out, `${JSON.stringify(report, null, 2)}\n`)
    const summary = renderSummary(report)
    console.log(`\n${summary}\nWrote ${options.out} and traces to ${options.traceDir}`)
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, summary)
    }
  } finally {
    await browser.close()
    await server.close()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error)
  process.exitCode = 1
})
