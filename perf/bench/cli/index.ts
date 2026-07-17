#!/usr/bin/env -S tsx --conditions=monorepo
// oxlint-disable no-console
/**
 * The bench CLI — one discoverable entry point for developers and CI:
 * `pnpm bench help` (or `pnpm bench <command> --help`) from the repo root.
 * Command parsers and their implementations live next to the subsystems they
 * drive; this file only composes them and dispatches on the parsed command.
 */
import process from 'node:process'

import {or} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {run} from '@optique/run'

import {resolveFromInvocation} from './benchRoot'
import {certPathCommand, writeCertificateFile} from './commands/certPath'
import {devCommand} from './commands/dev'
import {prepareReference, prepareReferenceCommand} from './commands/prepareReference'
import {reportCommand} from './commands/report'
import {runCommand} from './commands/run'
import {listScenarios, scenariosCommand} from './commands/scenarios'
import {storeCommand} from './commands/store'

const result = run(
  or(
    runCommand,
    reportCommand,
    storeCommand,
    devCommand,
    scenariosCommand,
    prepareReferenceCommand,
    certPathCommand,
  ),
  {
    programName: 'bench',
    brief: message`Hermetic studio performance benchmark suite (see perf/bench/README.md)`,
    help: 'both',
    aboveError: 'usage',
    showDefault: true,
    showChoices: true,
    // pnpm script chains can forward stray `--` separators — drop them so
    // flags always parse
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
  },
)

// Implementations load lazily: CI jobs that only prepare or report must not
// resolve the runner's workspace imports (e.g. @sanity/mutator), which are
// not built in those jobs — and `bench help` stays instant
switch (result.action) {
  case 'run':
    await (await import('./commands/runImpl')).runBench(result)
    break
  case 'report':
    ;(await import('../report/writeReport')).writeMergedReport(
      result.dir ? resolveFromInvocation(result.dir) : undefined,
    )
    break
  case 'store':
    await (
      await import('../report/storeToSanity')
    ).storeRun(result.file ? resolveFromInvocation(result.file) : undefined)
    break
  case 'dev':
    await (await import('../runner/devServer')).startBenchDev(result.scenario)
    break
  case 'scenarios':
    listScenarios(result.json, result.mode, result.schedule)
    break
  case 'prepare-reference':
    prepareReference(result)
    break
  case 'cert-path':
    console.log(await writeCertificateFile())
    break
}
