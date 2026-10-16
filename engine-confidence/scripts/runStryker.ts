// oxlint-disable no-console
import {spawn} from 'node:child_process'
import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  type WriteStream,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import {parseArgs} from 'node:util'

import {STRYKER_TARGET_IDS, type StrykerTargetId} from '@repo/utils/engine-confidence'

import {computePinnedHash, readJsonFile, readPinnedConfig, readTier1Config} from './config'
import {dirtyPathsUnder} from './git'
import {engineConfidenceDirectory, repositoryRoot, strykerReportsDirectory} from './paths'
import {decideRunMode} from './stryker/incremental'
import {
  dryRunTestCount,
  readStrykerReport,
  reusedMutantsFromLog,
  type StrykerRunMeta,
  zeroTestSurvivorsOf,
} from './stryker/report'

const EXIT_STRYKER_FAILED = 1
const EXIT_DIRTY_TREE = 3
const EXIT_GUARD_FAILED = 5
const EXIT_HASH_MISMATCH = 6

function isTargetId(value: string | undefined): value is StrykerTargetId {
  return STRYKER_TARGET_IDS.some((target) => target === value)
}

function requireOrExit(condition: boolean, exitCode: number, messages: string[]): void {
  if (condition) return
  messages.forEach((message) => console.error(message))
  process.exit(exitCode)
}

function readPreviousMeta(
  previousDirectory: string | undefined,
  target: StrykerTargetId,
): StrykerRunMeta | undefined {
  if (previousDirectory === undefined) return undefined
  const metaPath = path.join(previousDirectory, `${target}.run.json`)
  const incrementalPath = path.join(previousDirectory, `${target}.incremental.json`)
  return existsSync(metaPath) && existsSync(incrementalPath)
    ? readJsonFile<StrykerRunMeta>(metaPath)
    : undefined
}

function collectOutput(chunks: string[], logStream: WriteStream): (chunk: Buffer) => void {
  return (chunk) => {
    const text = chunk.toString('utf8')
    chunks.push(text)
    logStream.write(text)
    process.stdout.write(text)
  }
}

function runStrykerProcess(options: {
  packageDirectory: string
  configPath: string
  force: boolean
  logPath: string
}): Promise<{exitCode: number | null; output: string}> {
  const {packageDirectory, configPath, force, logPath} = options
  const strykerBinary = path.join(engineConfidenceDirectory, 'node_modules', '.bin', 'stryker')
  const logStream = createWriteStream(logPath)
  const chunks: string[] = []
  return new Promise((resolve, reject) => {
    const child = spawn(strykerBinary, ['run', configPath, ...(force ? ['--force'] : [])], {
      cwd: packageDirectory,
      env: {...process.env, FORCE_COLOR: '0'},
    })
    const collect = collectOutput(chunks, logStream)
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    child.on('error', reject)
    child.on('close', (exitCode) => {
      logStream.end()
      resolve({exitCode, output: chunks.join('')})
    })
  })
}

function removeOrphanedSetupFiles(packageDirectory: string): void {
  readdirSync(packageDirectory)
    .filter((fileName) => /^stryker-setup-\d+\.js$/.test(fileName))
    .forEach((fileName) => rmSync(path.join(packageDirectory, fileName), {force: true}))
}

function prepareIncrementalFile(options: {
  mode: 'full' | 'incremental'
  previousDirectory: string | undefined
  target: StrykerTargetId
}): void {
  const {mode, previousDirectory, target} = options
  const incrementalPath = path.join(strykerReportsDirectory, `${target}.incremental.json`)
  if (mode === 'full' || previousDirectory === undefined) {
    rmSync(incrementalPath, {force: true})
    return
  }
  const previousIncrementalPath = path.join(previousDirectory, `${target}.incremental.json`)
  if (path.resolve(previousIncrementalPath) === path.resolve(incrementalPath)) return
  copyFileSync(previousIncrementalPath, incrementalPath)
}

async function runTarget(
  target: StrykerTargetId,
  options: {full: boolean; previousDirectory: string | undefined},
): Promise<void> {
  const pinnedConfig = readPinnedConfig()
  const configHash = computePinnedHash()
  requireOrExit(configHash === pinnedConfig.pinnedHash, EXIT_HASH_MISMATCH, [
    'The pinned config changed without a version bump. Run `pnpm engine-confidence pin`.',
  ])

  const packageDir = readTier1Config()[target].packageDir
  const dirtyBefore = dirtyPathsUnder([packageDir])
  requireOrExit(dirtyBefore.length === 0, EXIT_DIRTY_TREE, [
    `${packageDir} has local changes; Stryker rewrites sources in place. Refusing.`,
    ...dirtyBefore.map((line) => `  ${line}`),
  ])

  mkdirSync(strykerReportsDirectory, {recursive: true})
  const decision = decideRunMode({
    full: options.full,
    previousMeta: readPreviousMeta(options.previousDirectory, target),
    configVersion: pinnedConfig.version,
    configHash,
  })
  prepareIncrementalFile({
    mode: decision.mode,
    previousDirectory: options.previousDirectory,
    target,
  })
  console.log(
    decision.mode === 'full'
      ? `Stryker ${target}: full run (${decision.reason})`
      : `Stryker ${target}: incremental run`,
  )

  const startedAt = Date.now()
  const {exitCode, output} = await runStrykerProcess({
    packageDirectory: path.join(repositoryRoot, packageDir),
    configPath: path.join(engineConfidenceDirectory, 'stryker', `${target}.stryker.config.mjs`),
    force: decision.mode === 'full',
    logPath: path.join(strykerReportsDirectory, `${target}.log`),
  })
  const durationMs = Date.now() - startedAt
  removeOrphanedSetupFiles(path.join(repositoryRoot, packageDir))

  const dirtyAfter = dirtyPathsUnder([packageDir])
  if (dirtyAfter.length > 0) {
    console.error(
      `${packageDir} is dirty after the run. Restore: git checkout -- ${packageDir}/src`,
    )
    dirtyAfter.forEach((line) => console.error(`  ${line}`))
  }
  requireOrExit(exitCode === 0, EXIT_STRYKER_FAILED, [`Stryker exited with ${exitCode}`])

  const report = readStrykerReport(path.join(strykerReportsDirectory, `${target}.json`))
  const dryRunTests = dryRunTestCount(report)
  const meta: StrykerRunMeta = {
    target,
    mode: decision.mode,
    reusedMutants: decision.mode === 'full' ? 0 : reusedMutantsFromLog(output),
    dryRunTests,
    durationMs,
    configVersion: pinnedConfig.version,
    configHash,
  }
  writeFileSync(
    path.join(strykerReportsDirectory, `${target}.run.json`),
    `${JSON.stringify(meta, null, 2)}\n`,
  )

  const zeroTestSurvivors = zeroTestSurvivorsOf(report)
  const dryRunFloor = pinnedConfig.stryker.dryRunFloor[target]
  const guardFailures = [
    ...(zeroTestSurvivors.length > 0
      ? [
          `Guard failed: ${zeroTestSurvivors.length} surviving mutant(s) covered by tests ran no test (vitest-runner patch lost?): ` +
            zeroTestSurvivors
              .slice(0, 5)
              .map((survivor) => `${survivor.file}:${survivor.line} #${survivor.mutantId}`)
              .join(', '),
        ]
      : []),
    ...(dryRunTests < dryRunFloor
      ? [
          `Guard failed: dry run found ${dryRunTests} tests, below the floor of ${dryRunFloor} (packages not built?)`,
        ]
      : []),
  ]
  requireOrExit(guardFailures.length === 0, EXIT_GUARD_FAILED, guardFailures)
  requireOrExit(dirtyAfter.length === 0, EXIT_DIRTY_TREE, [])

  console.log(
    `Stryker ${target}: ${meta.mode}, ${dryRunTests} tests, ${meta.reusedMutants} reused, ${Math.round(durationMs / 1000)}s`,
  )
}

const {values} = parseArgs({
  options: {
    'target': {type: 'string'},
    'full': {type: 'boolean', default: false},
    'previous-dir': {type: 'string'},
  },
})
const requestedTarget = values.target
const previousDirectory = values['previous-dir'] ? path.resolve(values['previous-dir']) : undefined

if (isTargetId(requestedTarget)) {
  await runTarget(requestedTarget, {full: values.full, previousDirectory})
} else {
  console.error(`--target must be one of: ${STRYKER_TARGET_IDS.join(', ')}`)
  process.exit(EXIT_STRYKER_FAILED)
}
