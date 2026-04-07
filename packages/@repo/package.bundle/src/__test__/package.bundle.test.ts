import {describe, expect, it} from 'vitest'

import {stripCssImportsPlugin} from '../package.bundle'

describe('stripCssImportsPlugin()', () => {
  it('removes css import side effects from JS chunks', () => {
    const bundle = {
      'index.mjs': {
        type: 'chunk',
        code: [
          "import './index.css'",
          'import "./theme.css";',
          "import {defineConfig} from 'vite'",
          "export * from './shared.js'",
        ].join('\n'),
      },
    } as any

    stripCssImportsPlugin().generateBundle?.({} as never, bundle)

    expect(bundle['index.mjs'].code).not.toContain("import './index.css'")
    expect(bundle['index.mjs'].code).not.toContain('import "./theme.css";')
    expect(bundle['index.mjs'].code).toContain("import {defineConfig} from 'vite'")
    expect(bundle['index.mjs'].code).toContain("export * from './shared.js'")
    expect(bundle['index.mjs'].code).toContain('css served separately via <link> tag')
  })

  it('does not modify asset entries', () => {
    const bundle = {
      'index.css': {
        type: 'asset',
        source: "import './index.css'",
      },
    } as any

    stripCssImportsPlugin().generateBundle?.({} as never, bundle)

    expect(bundle['index.css'].source).toBe("import './index.css'")
  })
})
