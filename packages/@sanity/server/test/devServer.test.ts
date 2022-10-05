import path from 'path'
import {InlineConfig} from 'vite'
import {startDevServer, DevServer} from '../src/devServer'
import {isRecord} from '../src/helpers'
import {_request} from './_request'

describe('devServer', () => {
  let server: DevServer | undefined

  afterEach(async () => {
    if (server) {
      await server.close()
    }
  })

  // @todo should this still work?
  it.skip('should serve multiple entrypoints/inputs', async () => {
    const projectPath = path.resolve(__dirname, 'fixtures/devServer/basic')

    server = await startDevServer({
      cwd: projectPath,
      basePath: '/',
      staticPath: path.resolve(projectPath, 'static'),
      httpPort: 9700,
      httpHost: 'localhost',

      reactStrictMode: false,
      vite(viteConfig: InlineConfig) {
        return {
          ...viteConfig,
          build: {
            ...viteConfig.build,
            rollupOptions: {
              ...viteConfig.build?.rollupOptions,
              input: {
                ...(isRecord(viteConfig.build?.rollupOptions?.input)
                  ? viteConfig.build?.rollupOptions?.input
                  : {}),
                frame: path.resolve(projectPath, 'frame/index.html'),
              },
            },
          },
        }
      },
    })

    const res = await _request({url: 'http://localhost:9700/frame'})

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('<script type="module" src="/frame/main.tsx"></script>')
  })
})
