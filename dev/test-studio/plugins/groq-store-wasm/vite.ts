import {createReadStream} from 'node:fs'
import {copyFile, mkdir} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {join} from 'node:path'

import {type Plugin} from 'vite'

const require = createRequire(import.meta.url)

/**
 * `@sanity/groq-store-wasm`'s scripts, served at the site root so the service worker's scope
 * covers the whole studio and the SharedWorker and wasm load from the same origin.
 */
const workerFiles = {
  'groq-sw.js': require.resolve('@sanity/groq-store-wasm/workers/sw.js'),
  'groq-host.js': require.resolve('@sanity/groq-store-wasm/workers/host.js'),
  'groq_wasm_bg.wasm': require.resolve('@sanity/groq-store-wasm/groq_wasm_bg.wasm'),
} as const

const isWorkerFile = (name: string | undefined): name is keyof typeof workerFiles =>
  name !== undefined && Object.hasOwn(workerFiles, name)

/** Serves the groq-store-wasm workers in `sanity dev` and copies them next to `index.html` on build. */
export function groqStoreWorkers(): Plugin {
  let outDir = 'dist'
  return {
    name: 'groq-store-wasm:workers',
    configResolved(config) {
      outDir = config.build.outDir
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const name = request.url?.split('?')[0]?.slice(1)
        if (!isWorkerFile(name)) {
          next()
          return
        }
        response.setHeader(
          'content-type',
          name.endsWith('.wasm') ? 'application/wasm' : 'text/javascript; charset=utf-8',
        )
        response.setHeader('cache-control', 'no-cache')
        createReadStream(workerFiles[name]).pipe(response)
      })
    },
    async writeBundle() {
      await mkdir(outDir, {recursive: true})
      await Promise.all(
        Object.entries(workerFiles).map(([name, file]) => copyFile(file, join(outDir, name))),
      )
    },
  }
}
