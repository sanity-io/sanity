import {describe, expect, it} from 'vitest'

import {stripCssImportsPlugin} from '../package.bundle'

function runPlugin(bundle: Record<string, any>) {
  const plugin = stripCssImportsPlugin()
  // generateBundle is a Rollup hook — call it directly with a mock context
  ;(plugin.generateBundle as Function).call({}, {} as never, bundle)
}

describe('stripCssImportsPlugin()', () => {
  it('removes imports for CSS assets produced by the build', () => {
    const bundle = {
      // CSS asset produced by vanilla-extract
      'index.css': {
        type: 'asset',
        source: ':root { --color: red; }',
      },
      // JS chunk that imports the CSS
      'index.mjs': {
        type: 'chunk',
        code: [
          "import './index.css'",
          "import {defineConfig} from 'vite'",
          "export * from './shared.js'",
        ].join('\n'),
      },
    } as any

    runPlugin(bundle)

    expect(bundle['index.mjs'].code).not.toContain("import './index.css'")
    expect(bundle['index.mjs'].code).toContain("import {defineConfig} from 'vite'")
    expect(bundle['index.mjs'].code).toContain("export * from './shared.js'")
    expect(bundle['index.mjs'].code).toContain('css served separately via <link> tag')
  })

  it('handles both single and double quoted imports', () => {
    const bundle = {
      'index.css': {type: 'asset', source: 'body {}'},
      'index.mjs': {
        type: 'chunk',
        code: [
          "import './index.css'",
          'import "./index.css";',
        ].join('\n'),
      },
    } as any

    runPlugin(bundle)

    expect(bundle['index.mjs'].code).not.toContain('.css')
  })

  it('preserves CSS imports that are NOT in the bundle output', () => {
    const bundle = {
      // Only index.css is a build asset — no third-party.css asset exists
      'index.css': {
        type: 'asset',
        source: ':root { --color: red; }',
      },
      'index.mjs': {
        type: 'chunk',
        code: [
          "import './index.css'",
          "import 'awesome-datepicker/styles.css'",
          "import './some-other-lib.css'",
        ].join('\n'),
      },
    } as any

    runPlugin(bundle)

    // Our build CSS is stripped
    expect(bundle['index.mjs'].code).not.toContain("import './index.css'")
    // Third-party CSS imports are preserved — they're not in our bundle output
    expect(bundle['index.mjs'].code).toContain("import 'awesome-datepicker/styles.css'")
    expect(bundle['index.mjs'].code).toContain("import './some-other-lib.css'")
  })

  it('does not modify asset entries', () => {
    const bundle = {
      'index.css': {
        type: 'asset',
        source: "import './index.css'",
      },
    } as any

    runPlugin(bundle)

    expect(bundle['index.css'].source).toBe("import './index.css'")
  })

  it('does nothing when there are no CSS assets in the bundle', () => {
    const bundle = {
      'index.mjs': {
        type: 'chunk',
        code: "import 'some-package/styles.css'\nexport default {}",
      },
    } as any

    const originalCode = bundle['index.mjs'].code
    runPlugin(bundle)

    // No CSS assets in bundle → no stripping at all
    expect(bundle['index.mjs'].code).toBe(originalCode)
  })

  it('handles multiple CSS assets from the build', () => {
    const bundle = {
      'index.css': {type: 'asset', source: 'body {}'},
      'theme.css': {type: 'asset', source: ':root {}'},
      'index.mjs': {
        type: 'chunk',
        code: [
          "import './index.css'",
          "import './theme.css'",
          "import 'external/styles.css'",
        ].join('\n'),
      },
    } as any

    runPlugin(bundle)

    expect(bundle['index.mjs'].code).not.toContain("import './index.css'")
    expect(bundle['index.mjs'].code).not.toContain("import './theme.css'")
    // External CSS import preserved
    expect(bundle['index.mjs'].code).toContain("import 'external/styles.css'")
  })
})
