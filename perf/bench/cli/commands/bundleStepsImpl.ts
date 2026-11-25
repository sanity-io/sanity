// oxlint-disable no-console
/** The `bench bundle-steps` implementation — see ./bundleSteps.ts for the parser. */
import fs from 'node:fs'

import {EXPERIMENT} from '../../constants'
import {getBenchTls} from '../../mock-api/tls'
import {launchBrowser} from '../../runner/browser'
import {
  type BundleStepsReport,
  formatBundleSteps,
  measureBundleSteps,
} from '../../runner/bundleSteps'
import {startSide} from '../../runner/servers'
import {resolveFromInvocation} from '../benchRoot'
import {type BundleStepsArgs} from './bundleSteps'

export async function runBundleSteps(argv: BundleStepsArgs): Promise<void> {
  const dist = resolveFromInvocation(argv.dist)
  if (!fs.existsSync(dist)) {
    throw new Error(`No studio build at ${dist}: run \`pnpm build:bench\` first`)
  }
  const baseline: BundleStepsReport | undefined = argv.compare
    ? JSON.parse(fs.readFileSync(resolveFromInvocation(argv.compare), 'utf8'))
    : undefined

  const running = await startSide(EXPERIMENT, dist)
  const browser = await launchBrowser(!argv.headed, (await getBenchTls()).spki)
  try {
    const report = await measureBundleSteps({browser, running, distDir: dist})
    console.log(formatBundleSteps(report, baseline))
    if (argv.jsonOut) {
      fs.writeFileSync(resolveFromInvocation(argv.jsonOut), `${JSON.stringify(report, null, 2)}\n`)
    }
  } finally {
    await browser.close()
    await running.close()
  }
}
