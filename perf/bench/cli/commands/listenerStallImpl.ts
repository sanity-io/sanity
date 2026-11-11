// oxlint-disable no-console
/** The `bench listener-stall` implementation — see ./listenerStall.ts for the parser and docs. */
import path from 'node:path'
import process from 'node:process'

import chalk from 'chalk'

import {EXPERIMENT} from '../../constants'
import {getBenchTls} from '../../mock-api/tls'
import {launchBrowser} from '../../runner/browser'
import {startSide} from '../../runner/servers'
import {
  API_MAX_CONCURRENT_STREAMS,
  type ListenerStallCheck,
  type ListenerStallEvent,
  runListenerStallSession,
} from '../../runner/session/listenerStall'
import {resolveFromInvocation} from '../benchRoot'
import {type ListenerStallArgs} from './listenerStall'
import {readBuildFlags} from './runImpl'

function describeEvent(event: ListenerStallEvent): string {
  return (
    `${event.kind} #${event.stallOccurrence}: ${event.listenersAllTabs} listeners ` +
    `(${event.listenersThisTab} here + ${event.listenersOtherTabs} in other tabs), ` +
    `${event.knownStudioTabs} tabs, ${event.stalledListenersThisTab} stalled here, ` +
    `stalled ${event.stalledForMs}ms, ${event.protocol}, budget ${event.budget}`
  )
}

function printCheck(check: ListenerStallCheck): void {
  const passed = check.failures.length === 0
  const status = passed ? chalk.green('PASS') : chalk.red('FAIL')
  console.log(`\n${status} ${chalk.bold(check.name)} (${(check.durationMs / 1000).toFixed(0)}s)`)
  check.events.forEach((event) => console.log(`  event ${describeEvent(event)}`))
  check.failures.forEach((failure) => console.log(chalk.red(`  ${failure}`)))
  check.notes.forEach((note) => console.log(chalk.dim(`  ${note}`)))
  if (check.networkFailures.length > 0) {
    console.log(chalk.yellow(`  ${check.networkFailures.length} refused or dropped requests:`))
    check.networkFailures
      .slice(0, 5)
      .forEach((failure) => console.log(chalk.yellow(`    ${failure}`)))
  }
}

export async function runListenerStall(argv: ListenerStallArgs): Promise<void> {
  const dist = resolveFromInvocation(argv.dist)
  if (readBuildFlags(dist).customizations === undefined) {
    console.error(
      `No customization build at ${dist} — run \`pnpm --filter bench build:customizations\` first`,
    )
    process.exit(1)
  }

  const running = await startSide(EXPERIMENT, dist, {
    maxConcurrentStreams: API_MAX_CONCURRENT_STREAMS,
  })
  const browser = await launchBrowser(!argv.headed, (await getBenchTls()).spki)
  console.log(
    `listener stall checks against ${path.relative(process.cwd(), dist) || dist}, ` +
      `mock capped at ${API_MAX_CONCURRENT_STREAMS} concurrent HTTP/2 streams`,
  )

  try {
    const checks = await runListenerStallSession({
      browser,
      running,
      log: (line) => console.log(chalk.cyan(line)),
    })
    checks.forEach(printCheck)
    const failed = checks.filter((check) => check.failures.length > 0)
    console.log(`\n${checks.length - failed.length}/${checks.length} listener stall checks passed`)
    if (failed.length > 0) process.exitCode = 1
  } finally {
    await browser.close()
    await running.close()
  }
}
