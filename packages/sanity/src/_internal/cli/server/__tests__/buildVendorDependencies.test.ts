import fs from 'node:fs'
import path from 'node:path'

import {type InlineConfig} from 'vite'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {buildVendorDependencies} from '../buildVendorDependencies'

// Mocking the vite.build function to inspect its calls. This allows us to test
// that the function is called with the correct configuration without actually
// performing the build process.
vi.mock('vite', () => ({build: vi.fn()}))

describe('buildVendorDependencies', async () => {
  const {build} = await import('vite')
  const packageRoot = path.resolve(__dirname, '../../../../..')
  const examplesRoot = path.join(packageRoot, './fixtures/examples')
  const outputDir = './output-dir'

  beforeEach(async () => {
    vi.resetAllMocks()
    const vite = await import('vite')
    ;(vite as any).build.mockImplementation((input: InlineConfig) => {
      const libOptions = input.build?.lib
      if (!libOptions) throw new Error(`Expected lib in inline config`)

      const output = Object.keys(libOptions.entry).map((entry) => ({
        type: 'chunk',
        name: entry,
        fileName: `${entry.replace('/', '-')}-12345.mjs`,
      }))
      return Promise.resolve({output})
    })
  })

  describe.each([
    {basePath: '/', expectedPath: '/'},
    {basePath: '//', expectedPath: '/'},
    {basePath: 'some-path', expectedPath: '/some-path/'},
    {basePath: '/some-path', expectedPath: '/some-path/'},
  ])('basePath: $basePath', ({basePath, expectedPath}) => {
    it('should throw if there is no matching entry in VENDOR_IMPORTS', () => {
      const cwd = path.join(examplesRoot, 'prj-with-styled-components-5')

      return expect(buildVendorDependencies({cwd, basePath: basePath, outputDir})).rejects.toThrow(
        "Package 'styled-components' requires at least 6.1.0.",
      )
    })

    it('should return the expected entry points for react 18', async () => {
      const cwd = path.join(examplesRoot, 'prj-with-react-18')
      const imports = await buildVendorDependencies({cwd, basePath: basePath, outputDir})

      expect(imports).toEqual({
        'react': `${expectedPath}vendor/react-index-12345.mjs`,
        'react-dom': `${expectedPath}vendor/react-dom-index-12345.mjs`,
        'react-dom/client': `${expectedPath}vendor/react-dom-client-12345.mjs`,
        'react-dom/package.json': `${expectedPath}vendor/react-dom-package.json-12345.mjs`,
        'react-dom/server': `${expectedPath}vendor/react-dom-server-12345.mjs`,
        'react-dom/server.browser': `${expectedPath}vendor/react-dom-server.browser-12345.mjs`,
        'react/jsx-dev-runtime': `${expectedPath}vendor/react-jsx-dev-runtime-12345.mjs`,
        'react/jsx-runtime': `${expectedPath}vendor/react-jsx-runtime-12345.mjs`,
        'react/package.json': `${expectedPath}vendor/react-package.json-12345.mjs`,
        'styled-components': `${expectedPath}vendor/styled-components-index-12345.mjs`,
        'styled-components/package.json': `${expectedPath}vendor/styled-components-package.json-12345.mjs`,
      })

      expect(build).toHaveBeenCalledTimes(1)
      const [buildConfig] = build.mock.calls[0]

      expect(buildConfig).toMatchObject({
        root: cwd,
        configFile: false,
        mode: 'production',
        define: {'process.env.NODE_ENV': JSON.stringify('production')},
        build: {
          minify: true,
          emptyOutDir: false,
          outDir: path.join(outputDir, 'vendor'),
          lib: {formats: ['es']},
          rollupOptions: {
            external: [
              'react',
              'react/jsx-runtime',
              'react/jsx-dev-runtime',
              'react/package.json',
              'react-dom',
              'react-dom/client',
              'react-dom/server',
              'react-dom/server.browser',
              'react-dom/package.json',
              'styled-components',
              'styled-components/package.json',
            ],
            output: {exports: 'named', format: 'es'},
            treeshake: {preset: 'recommended'},
          },
        },
      })

      const entry: Record<string, string> = buildConfig.build.lib.entry
      const chunkNames = Object.keys(entry)
      const resolvedEntries = Object.values(entry)

      const {exports: reactExports} = JSON.parse(
        await fs.promises.readFile(entry['react/package.json'], 'utf-8'),
      )
      const {exports: reactDomExports} = JSON.parse(
        await fs.promises.readFile(entry['react-dom/package.json'], 'utf-8'),
      )

      // Verify the structure of the exports in the package.json files
      // We're specifically checking the `exports` field of `react` and
      // `react-dom` to see if there are any new subpath exports. Renovate
      // automatically updates `react` and `react-dom`, so if a new subpath export
      // is added, this test will fail. This failure acts as a signal for us to
      // review and potentially add support for the new subpath if applicable.
      expect(Object.keys(reactExports)).toEqual([
        '.',
        './package.json',
        './jsx-runtime',
        './jsx-dev-runtime',
      ])
      expect(Object.keys(reactDomExports)).toEqual([
        '.',
        './client',
        './server',
        './server.browser',
        './server.node',
        './profiling',
        './test-utils',
        './package.json',
      ])

      expect(chunkNames).toEqual([
        'react/index',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react/package.json',
        'react-dom/index',
        'react-dom/client',
        'react-dom/server',
        'react-dom/server.browser',
        'react-dom/package.json',
        'styled-components/index',
        'styled-components/package.json',
      ])

      expect(resolvedEntries).toHaveLength(chunkNames.length)
      expect(resolvedEntries.every(fs.existsSync)).toBe(true)
    })

    it('should return the expected entry points for react 19', async () => {
      const cwd = path.join(examplesRoot, 'prj-with-react-19')
      const imports = await buildVendorDependencies({cwd, basePath, outputDir})

      expect(imports).toEqual({
        'react': `${expectedPath}vendor/react-index-12345.mjs`,
        'react-dom': `${expectedPath}vendor/react-dom-index-12345.mjs`,
        'react-dom/client': `${expectedPath}vendor/react-dom-client-12345.mjs`,
        'react-dom/package.json': `${expectedPath}vendor/react-dom-package.json-12345.mjs`,
        'react-dom/server': `${expectedPath}vendor/react-dom-server-12345.mjs`,
        'react-dom/server.browser': `${expectedPath}vendor/react-dom-server.browser-12345.mjs`,
        'react-dom/static': `${expectedPath}vendor/react-dom-static-12345.mjs`,
        'react-dom/static.browser': `${expectedPath}vendor/react-dom-static.browser-12345.mjs`,
        'react/compiler-runtime': `${expectedPath}vendor/react-compiler-runtime-12345.mjs`,
        'react/jsx-dev-runtime': `${expectedPath}vendor/react-jsx-dev-runtime-12345.mjs`,
        'react/jsx-runtime': `${expectedPath}vendor/react-jsx-runtime-12345.mjs`,
        'react/package.json': `${expectedPath}vendor/react-package.json-12345.mjs`,
        'styled-components': `${expectedPath}vendor/styled-components-index-12345.mjs`,
        'styled-components/package.json': `${expectedPath}vendor/styled-components-package.json-12345.mjs`,
      })

      expect(build).toHaveBeenCalledTimes(1)
      const [buildConfig] = build.mock.calls[0]

      expect(buildConfig).toMatchObject({
        root: cwd,
        configFile: false,
        mode: 'production',
        define: {'process.env.NODE_ENV': JSON.stringify('production')},
        build: {
          minify: true,
          emptyOutDir: false,
          outDir: path.join(outputDir, 'vendor'),
          lib: {formats: ['es']},
          rollupOptions: {
            external: [
              'react',
              'react/jsx-runtime',
              'react/jsx-dev-runtime',
              'react/compiler-runtime',
              'react/package.json',
              'react-dom',
              'react-dom/client',
              'react-dom/server',
              'react-dom/server.browser',
              'react-dom/static',
              'react-dom/static.browser',
              'react-dom/package.json',
              'styled-components',
              'styled-components/package.json',
            ],
            output: {exports: 'named', format: 'es'},
            treeshake: {preset: 'recommended'},
          },
        },
      })

      const entry: Record<string, string> = buildConfig.build.lib.entry
      const chunkNames = Object.keys(entry)
      const resolvedEntries = Object.values(entry)

      // Verify the structure of the exports in the package.json files
      // We're specifically checking the `exports` field of `react` and
      // `react-dom` to see if there are any new subpath exports. Renovate
      // automatically updates `react` and `react-dom`, so if a new subpath export
      // is added, this test will fail. This failure acts as a signal for us to
      // review and potentially add support for the new subpath if applicable.
      const {exports: reactExports} = JSON.parse(
        await fs.promises.readFile(entry['react/package.json'], 'utf-8'),
      )
      const {exports: reactDomExports} = JSON.parse(
        await fs.promises.readFile(entry['react-dom/package.json'], 'utf-8'),
      )

      expect(Object.keys(reactExports)).toEqual([
        '.',
        './package.json',
        './jsx-runtime',
        './jsx-dev-runtime',
        './compiler-runtime',
      ])

      expect(Object.keys(reactDomExports)).toEqual([
        '.',
        './client',
        './server',
        './server.browser',
        './server.bun',
        './server.edge',
        './server.node',
        './static',
        './static.browser',
        './static.edge',
        './static.node',
        './profiling',
        './test-utils',
        './package.json',
      ])

      expect(chunkNames).toEqual([
        'react/index',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react/compiler-runtime',
        'react/package.json',
        'react-dom/index',
        'react-dom/client',
        'react-dom/server',
        'react-dom/server.browser',
        'react-dom/static',
        'react-dom/static.browser',
        'react-dom/package.json',
        'styled-components/index',
        'styled-components/package.json',
      ])

      expect(resolvedEntries).toHaveLength(chunkNames.length)
      expect(resolvedEntries.every(fs.existsSync)).toBe(true)
    })
  })
})
