import type {Plugin} from 'vite'

export function sanityBasePathRedirectPlugin(basePath: string | undefined): Plugin {
  return {
    name: 'sanity/server/sanity-base-path-redirect',
    apply: 'serve',
    configurePreviewServer(vitePreviewServer) {
      return () => {
        if (!basePath) {
          return
        }

        vitePreviewServer.middlewares.use((req, res, next) => {
          if (req.url !== '/') {
            next()
            return
          }

          res.writeHead(302, {Location: basePath})
          res.end()
        })
      }
    },
  }
}
