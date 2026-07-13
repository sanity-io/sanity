// oxlint-disable no-console
/**
 * `bench dev` — interactive debugging mode: starts the experiment-side
 * mock API (plain HTTP) plus `sanity dev`, and seeds a document to type into.
 * No auth needed: the mock's /users/me answers with a signed-in user, so the
 * studio boots straight into the workspace.
 */
import {spawn} from 'node:child_process'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {DATASET, EXPERIMENT} from '../constants'
import {createMockApi} from '../mock-api/createServer'
import {getBenchTls} from '../mock-api/tls'

const benchRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const SEED_DOCUMENT_ID = 'bench-dev-doc'

export async function startBenchDev(): Promise<void> {
  const mock = createMockApi({
    port: EXPERIMENT.apiPort,
    projectId: EXPERIMENT.projectId,
    dataset: DATASET,
    tls: await getBenchTls(),
  })
  await mock.listen()
  mock.store.seed([
    {_id: SEED_DOCUMENT_ID, _type: 'singleString', stringField: 'type here'},
    {_id: `drafts.${SEED_DOCUMENT_ID}`, _type: 'singleString', stringField: 'type here'},
  ])

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
      `[bench]   http://localhost:${EXPERIMENT.studioPort}/singleString/intent/edit/id=${SEED_DOCUMENT_ID};type=singleString`,
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
