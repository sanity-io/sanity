// oxlint-disable no-console
/**
 * `bench dev` — interactive debugging mode: starts the experiment-side
 * mock API (HTTP/2 over self-signed TLS, like the benchmark run — the studio
 * defaults to https://localhost:<port>) plus `sanity dev`, and seeds a
 * document to type into.
 * No auth needed: the mock's /users/me answers with a signed-in user, so the
 * studio boots straight into the workspace.
 */
import {spawn} from 'node:child_process'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {DATASET, EXPERIMENT} from '../constants'
import {createMockApi} from '../mock-api/createServer'
import {getBenchTls} from '../mock-api/tls'
import {getScenario} from '../scenarios'

const benchRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

export async function startBenchDev(scenarioName: string): Promise<void> {
  const scenario = getScenario(scenarioName)
  const mock = createMockApi({
    port: EXPERIMENT.apiPort,
    projectId: EXPERIMENT.projectId,
    dataset: DATASET,
    tls: await getBenchTls(),
  })
  await mock.listen()
  mock.setActiveFeatures(scenario.features ?? [])
  mock.store.seed(scenario.fixture())

  console.log(`[bench] mock API listening on ${mock.url} (project ${EXPERIMENT.projectId})`)

  const studio = spawn(
    'pnpm',
    ['exec', 'sanity', 'dev', '--no-auto-updates', '--port', String(EXPERIMENT.studioPort)],
    {cwd: benchRoot, stdio: 'inherit'},
  )

  console.log(
    [
      '',
      `[bench] once the studio is up, open:`,
      `[bench]   http://localhost:${EXPERIMENT.studioPort}/${scenario.workspace ?? scenario.name}/intent/edit/id=${scenario.documentId};type=${scenario.documentType}`,
      '',
    ].join('\n'),
  )

  async function shutdown() {
    studio.kill()
    await mock.close()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  studio.on('exit', () => shutdown())
}
