import path from 'path'
import {startDevServer} from '../src/devServer'
import {SanityViteConfig} from '../src/getViteConfig'
import {isRecord} from '../src/_helpers'
import {_request} from './_request'

describe('devServer', () => {
  it('should serve multiple entrypoints/inputs', async () => {
    const projectPath = path.resolve(__dirname, 'fixtures/devServer/basic')

    const server = await startDevServer({
      cwd: projectPath,
      basePath: '/',
      staticPath: path.resolve(projectPath, 'static'),
      httpPort: 9700,
      httpHost: 'localhost',

      vite(viteConfig: SanityViteConfig) {
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

    expect(res.body).toContain('<script type="module" src="/frame/main.tsx"></script>')

    await server.close()
  })
})
