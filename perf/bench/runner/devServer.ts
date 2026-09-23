// oxlint-disable no-console
/**
 * `bench dev` — interactive debugging mode: starts the experiment-side
 * mock API (HTTP/2 over self-signed TLS, like the benchmark run — the studio
 * defaults to https://localhost:<port>) plus `sanity dev`, and seeds a
 * document to type into.
 * No auth needed: the mock's /users/me answers with a signed-in user, so the
 * studio boots straight into the workspace.
 *
 * `--customizations` serves the nested customization project instead
 * (studio-customizations/, the config the settle scenarios run against) and
 * seeds every customization scenario's fixture, printing one URL per
 * scenario.
 */
import {spawn} from 'node:child_process'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {DATASET, EXPERIMENT} from '../constants'
import {createMockApi} from '../mock-api/createServer'
import {getBenchTls} from '../mock-api/tls'
import {SCENARIOS} from '../scenarios'
import {scenarioUrl} from './session/navigation'

const benchRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const SEED_DOCUMENT_ID = 'bench-dev-doc'

export async function startBenchDev(options: {customizations: boolean}): Promise<void> {
  const {customizations} = options
  const mock = createMockApi({
    port: EXPERIMENT.apiPort,
    projectId: EXPERIMENT.projectId,
    dataset: DATASET,
    tls: await getBenchTls(),
  })
  await mock.listen()

  const studioUrl = `http://localhost:${EXPERIMENT.studioPort}`
  const urls: string[] = []
  if (customizations) {
    for (const scenario of SCENARIOS.filter((candidate) => candidate.requiresCustomizations)) {
      mock.store.seed(scenario.fixture())
      urls.push(`${scenario.name.padEnd(16)} ${scenarioUrl(studioUrl, scenario)}`)
    }
  } else {
    mock.store.seed([
      {_id: SEED_DOCUMENT_ID, _type: 'singleString', stringField: 'type here'},
      {_id: `drafts.${SEED_DOCUMENT_ID}`, _type: 'singleString', stringField: 'type here'},
    ])
    urls.push(`${studioUrl}/singleString/intent/edit/id=${SEED_DOCUMENT_ID};type=singleString`)
  }

  console.log(`[bench] mock API listening on ${mock.url} (project ${EXPERIMENT.projectId})`)

  // The bin from perf/bench's node_modules: the nested customization project
  // is not a workspace package and has no node_modules of its own.
  const studio = spawn(
    path.join(benchRoot, 'node_modules/.bin/sanity'),
    ['dev', '--no-auto-updates', '--port', String(EXPERIMENT.studioPort)],
    {
      cwd: customizations ? path.join(benchRoot, 'studio-customizations') : benchRoot,
      stdio: 'inherit',
    },
  )

  console.log(
    ['', `[bench] once the studio is up, open:`, ...urls.map((url) => `[bench]   ${url}`), ''].join(
      '\n',
    ),
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
