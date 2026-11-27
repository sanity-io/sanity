/**
 * Compares Sanity Studio v6 (`main`) with v7 (`next-major`) on one minimal studio built in
 * production mode from each ref, served locally and measured with Playwright + Chromium:
 *
 *   pnpm perf:version-compare --runs 15 --out version-compare.json
 *
 * Load times are measured under emulated network and CPU conditions (--network, --cpu-throttle;
 * `slow-4g` and `fast-4g` by default), each sample in a fresh context with the HTTP cache off.
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
import {takeSample} from './measure'
import {
  compareMetric,
  renderSummary,
  type ComparisonReport,
  type MetricComparison,
  type ProfileResult,
  type VersionInfo,
} from './report'
import {startStaticServer} from './server'
import {isProfileName, PROFILES, type ProfileName, type ThrottleProfile} from './throttle'

// `pnpm --filter` runs the script from e2e/, so relative paths resolve against where pnpm was run.
const INVOKED_FROM = process.env.INIT_CWD ?? process.cwd()
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const API_HOST = 'https://api.sanity.work'
// The only origin the e2e project allows besides the e2e studio's own.
const DEFAULT_PORT = 3339

type Side = 'v6' | 'v7'

function parseOptions() {
  const {values} = parseArgs({
    options: {
      'cpu-throttle': {type: 'string'},
      'network': {default: 'slow-4g,fast-4g', type: 'string'},
      'out': {default: 'version-compare.json', type: 'string'},
      'port': {default: String(DEFAULT_PORT), type: 'string'},
      'reuse-builds': {default: false, type: 'boolean'},
      'runs': {default: '15', type: 'string'},
      'skip-authenticated': {default: false, type: 'boolean'},
      'v6-ref': {default: 'main', type: 'string'},
      'v7-ref': {default: 'next-major', type: 'string'},
      'work-dir': {default: path.join(os.tmpdir(), 'studio-version-compare'), type: 'string'},
    },
  })
  const runs = Number(values.runs)
  if (!Number.isInteger(runs) || runs < 1) throw new Error('--runs must be a positive integer')
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
  return {
    out: path.resolve(INVOKED_FROM, values.out),
    profiles,
    port: Number(values.port),
    reuse: values['reuse-builds'],
    runs,
    skipAuthenticated: values['skip-authenticated'],
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

  const server = await startStaticServer(options.port)
  const browser: Browser = await chromium.launch()
  const sides: Side[] = ['v6', 'v7']

  try {
    const initialJs: Partial<Record<Side, JsSize>> = {}
    const timings = new Map<
      string,
      {login: Record<Side, number[]>; tools: Record<Side, number[]>}
    >()

    const measure = async (
      kind: 'login' | 'tools',
      side: Side,
      profile: NamedProfile,
      record: boolean,
    ) => {
      server.setRoot(builds[side].distDir)
      const sample = await takeSample({
        auth: kind === 'tools' && token ? {projectId, token} : undefined,
        browser,
        kind,
        path: kind === 'tools' ? '/404' : '/',
        throttle: profile.throttle,
        url: server.url,
      })
      if (!record) return
      const result = timings.get(profile.name)!
      result[kind][side].push(sample.readyMs)
      // The files a cold load fetches do not depend on how fast the network is.
      initialJs[side] ??= await measureRequested(builds[side].distDir, sample.scriptPaths)
    }

    // One discarded pass per side, metric and profile warms DNS, TLS, the API's own caches and the
    // server's compressed copies. After that the sides alternate within every run, so slow drift
    // of the machine hits both equally.
    const kinds: Array<'login' | 'tools'> = authenticated ? ['login', 'tools'] : ['login']
    for (const profile of options.profiles) {
      timings.set(profile.name, {login: {v6: [], v7: []}, tools: {v6: [], v7: []}})
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
    for (const {name, throttle} of options.profiles) {
      const {login, tools} = timings.get(name)!
      const profileMetrics: Record<string, MetricComparison> = {
        loginReady: compareMetric(
          'Login page: navigation to login screen interactive, unauthenticated',
          'ms',
          login.v6,
          login.v7,
        ),
      }
      if (authenticated) {
        profileMetrics['toolsReady'] = compareMetric(
          '`/404` tool page: navigation to navbar tool list, authenticated',
          'ms',
          tools.v6,
          tools.v7,
        )
      }
      profiles[name] = {
        cacheDisabled: true,
        cpuThrottle: throttle.cpuThrottle,
        metrics: profileMetrics,
        network: throttle.network ? {...throttle.network} : null,
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
        profiles: options.profiles.map((profile) => profile.name).join(','),
        runs: options.runs,
        staticServerCompression: 'brotli',
        totalMemoryGiB: Math.round(os.totalmem() / 1024 ** 3),
      },
      generatedAt: new Date().toISOString(),
      metrics,
      profiles,
      schemaVersion: 2,
      versions: {v6: versionInfo(builds.v6), v7: versionInfo(builds.v7)},
    }

    await mkdir(path.dirname(options.out), {recursive: true})
    await writeFile(options.out, `${JSON.stringify(report, null, 2)}\n`)
    const summary = renderSummary(report)
    console.log(`\n${summary}\nWrote ${options.out}`)
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
