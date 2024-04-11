import fs from 'node:fs'
import path from 'node:path'

import history from 'connect-history-api-fallback'
import {type Plugin} from 'vite'

/**
 * This is a Vite plugin for supporting locations containing `.` in their pathname.
 *
 * @see https://github.com/vitejs/vite/issues/2245
 */
export function sanityDotWorkaroundPlugin(): Plugin {
  return {
    name: 'sanity/server/dot-workaround',
    configureServer(server) {
      const {root} = server.config

      return () => {
        const handler = history({
          disableDotRule: true,
          rewrites: [
            {
              from: /\/index.html$/,
              to: ({parsedUrl}) => {
                const pathname = parsedUrl.pathname

                if (pathname && fs.existsSync(path.join(root, pathname))) {
                  return pathname
                }

                return `/index.html`
              },
            },
          ],
        })

        server.middlewares.use((req, res, next) => {
          handler(req as any, res as any, next)
        })
      }
    },
  }
}
