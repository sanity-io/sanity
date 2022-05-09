import {Plugin, ViteDevServer} from 'vite'
import history from 'connect-history-api-fallback'

/**
 * This is a Vite plugin for supporting locations containing `.` in their pathname.
 *
 * @see https://github.com/vitejs/vite/issues/2245
 */
export function sanityDotWorkaroundPlugin(): Plugin {
  return {
    name: '@sanity/server/dot-workaround',
    configureServer(server: ViteDevServer) {
      return () => {
        const handler = history({
          disableDotRule: true,
          rewrites: [{from: /\/$/, to: () => '/index.html'}],
        })

        server.middlewares.use((req, res, next) => {
          handler(req as any, res as any, next)
        })
      }
    },
  }
}
