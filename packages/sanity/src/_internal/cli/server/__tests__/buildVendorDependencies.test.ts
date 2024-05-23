import path from 'node:path'

import {beforeEach, describe, expect, it, jest} from '@jest/globals'

import {buildVendorDependencies} from '../buildVendorDependencies'

jest.mock('vite', () => ({build: jest.fn()}))

describe('buildVendorDependencies', () => {
  const packageRoot = path.resolve(__dirname, '../../../../..')
  const examplesRoot = path.join(packageRoot, './fixtures/examples')
  const outputDir = './output-dir'

  beforeEach(() => {
    jest.resetAllMocks()
    const vite = require('vite')
    vite.build.mockResolvedValue({})
  })

  it('should pass the expected options to vite.build', () => {
    const cwd = path.join(examplesRoot, 'prj-with-styled-components-5')

    expect(buildVendorDependencies({cwd, outputDir})).rejects.toThrow(
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
  })
})
