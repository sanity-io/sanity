import fs from 'node:fs'
import path from 'node:path'

import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {buildVendorDependencies} from '../buildVendorDependencies'

// Mocking the vite.build function to inspect its calls. This allows us to test
// that the function is called with the correct configuration without actually
// performing the build process.
jest.mock('vite', () => ({build: jest.fn()}))

describe('buildVendorDependencies', () => {
  const {build} = require('vite')
  const packageRoot = path.resolve(__dirname, '../../../../..')
  const examplesRoot = path.join(packageRoot, './fixtures/examples')
  const outputDir = './output-dir'

  beforeEach(() => {
    jest.resetAllMocks()
    const vite = require('vite')
    vite.build.mockResolvedValue({})
  })

  it('should throw if there is no matching entry in VENDOR_IMPORTS', () => {
    const cwd = path.join(examplesRoot, 'prj-with-styled-components-5')

    return expect(buildVendorDependencies({cwd, outputDir})).rejects.toThrow(
      "Package 'styled-components' requires at least 6.1.0.",
    )
  })

  it('should return the expected entry points for react 18', async () => {
    const cwd = path.join(examplesRoot, 'prj-with-react-18')
    const imports = await buildVendorDependencies({cwd, outputDir})

    expect(imports).toEqual({
      'react': '/vendor/react/index.mjs',
      'react-dom': '/vendor/react-dom/index.mjs',
      'react-dom/client': '/vendor/react-dom/client.mjs',
      'react-dom/package.json': '/vendor/react-dom/package.json.mjs',
      'react-dom/server': '/vendor/react-dom/server.mjs',
      'react-dom/server.browser': '/vendor/react-dom/server.browser.mjs',
      'react/jsx-dev-runtime': '/vendor/react/jsx-dev-runtime.mjs',
      'react/jsx-runtime': '/vendor/react/jsx-runtime.mjs',
      'react/package.json': '/vendor/react/package.json.mjs',
      'styled-components': '/vendor/styled-components/index.mjs',
      'styled-components/package.json': '/vendor/styled-components/package.json.mjs',
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
    const imports = await buildVendorDependencies({cwd, outputDir})

    expect(imports).toEqual({
      'react': '/vendor/react/index.mjs',
      'react-dom': '/vendor/react-dom/index.mjs',
      'react-dom/client': '/vendor/react-dom/client.mjs',
      'react-dom/package.json': '/vendor/react-dom/package.json.mjs',
      'react-dom/server': '/vendor/react-dom/server.mjs',
      'react-dom/server.browser': '/vendor/react-dom/server.browser.mjs',
      'react-dom/static': '/vendor/react-dom/static.mjs',
      'react-dom/static.browser': '/vendor/react-dom/static.browser.mjs',
      'react/compiler-runtime': '/vendor/react/compiler-runtime.mjs',
      'react/jsx-dev-runtime': '/vendor/react/jsx-dev-runtime.mjs',
      'react/jsx-runtime': '/vendor/react/jsx-runtime.mjs',
      'react/package.json': '/vendor/react/package.json.mjs',
      'styled-components': '/vendor/styled-components/index.mjs',
      'styled-components/package.json': '/vendor/styled-components/package.json.mjs',
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
