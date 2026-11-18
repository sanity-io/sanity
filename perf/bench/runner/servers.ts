import {type BenchSide, DATASET} from '../constants'
import {createMockApi, type MockApiServer} from '../mock-api/createServer'
import {getBenchTls} from '../mock-api/tls'
import {serveStatic, type StaticServer} from './staticServer'

export interface RunningSide {
  side: BenchSide
  studioUrl: string
  mock: MockApiServer
  close: () => Promise<void>
}

/**
 * Bring up one A/B side: the static studio build plus its own mock API
 * instance (perfect state isolation between sides). Both speak HTTP/2+TLS —
 * see mock-api/tls.ts for why h1 is not an option.
 */
export async function startSide(side: BenchSide, distDir: string): Promise<RunningSide> {
  const tls = await getBenchTls()
  const mock = createMockApi({
    port: side.apiPort,
    projectId: side.projectId,
    dataset: DATASET,
    tls,
  })
  try {
    await mock.listen()
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'EADDRINUSE') {
      throw new Error(
        `Bench port ${side.apiPort} is already in use — another bench run (or a leftover ` +
          `\`pnpm bench:dev\`) is holding it. Wait for it to finish or stop it first.`,
        {cause: error},
      )
    }
    throw error
  }
  const studio = await serveStatic({dir: distDir, port: side.studioPort, tls})

  return {
    side,
    studioUrl: studio.url,
    mock,
    close: async () => {
      await Promise.all([studio.close(), mock.close()])
    },
  }
}
