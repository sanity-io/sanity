import {Features, transform} from 'lightningcss'
import {describe, expect, it} from 'vitest'

import {cleanupCssOutputPlugin, createDefaultConfig} from '../package.bundle'

describe('createDefaultConfig()', () => {
  it('injects the provided version as the __PKG_VERSION__ define', () => {
    const config = createDefaultConfig({version: '9.9.9-test.1'})
    expect(config.define?.['__PKG_VERSION__']).toBe('"9.9.9-test.1"')
  })

  it('excludes the Lightning CSS light-dark polyfill', () => {
    const config = createDefaultConfig({version: '9.9.9-test.1'})
    expect(config.css?.lightningcss?.exclude).toBe(Features.LightDark)
  })
})

/**
 * Vite 8's default CSS minify target (`baseline-widely-available`): Chrome 111,
 * Edge 111, Firefox 114, Safari 16.4. Those browsers predate native `light-dark()`.
 */
const VITE_BASELINE_WIDELY_AVAILABLE_TARGETS = {
  chrome: 111 << 16,
  edge: 111 << 16,
  firefox: 114 << 16,
  safari: (16 << 16) | (4 << 8),
  ios_saf: (16 << 16) | (4 << 8),
}

const LIGHT_DARK_CSS = '.x{color:light-dark(white,black)}'

describe('Lightning CSS light-dark minify', () => {
  it('rewrites light-dark() when the polyfill is left enabled', () => {
    const {code} = transform({
      filename: 'theme.css',
      code: Buffer.from(LIGHT_DARK_CSS),
      minify: true,
      targets: VITE_BASELINE_WIDELY_AVAILABLE_TARGETS,
    })
    const css = code.toString()

    expect(css).toContain('--lightningcss-light')
    expect(css).toContain('--lightningcss-dark')
    expect(css).not.toContain('light-dark(')
  })

  it('preserves light-dark() when the bundle config exclude is applied', () => {
    const config = createDefaultConfig({version: '9.9.9-test.1'})
    const {code} = transform({
      filename: 'theme.css',
      code: Buffer.from(LIGHT_DARK_CSS),
      minify: true,
      targets: VITE_BASELINE_WIDELY_AVAILABLE_TARGETS,
      exclude: config.css?.lightningcss?.exclude,
    })
    const css = code.toString()

    expect(css).toContain('light-dark(')
    expect(css).not.toContain('--lightningcss-light')
    expect(css).not.toContain('--lightningcss-dark')
  })
})

function runPlugin(bundle: Record<string, any>) {
  const plugin = cleanupCssOutputPlugin()
  // generateBundle is a Rollup hook — call it directly with a mock context
  ;(plugin.generateBundle as Function).call({}, {} as never, bundle)
}

describe('cleanupCssOutputPlugin() — CSS import stripping', () => {
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
        code: ["import './index.css'", 'import "./index.css";'].join('\n'),
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
        code: ["import './index.css'", "import './theme.css'", "import 'external/styles.css'"].join(
          '\n',
        ),
      },
    } as any

    runPlugin(bundle)

    expect(bundle['index.mjs'].code).not.toContain("import './index.css'")
    expect(bundle['index.mjs'].code).not.toContain("import './theme.css'")
    // External CSS import preserved
    expect(bundle['index.mjs'].code).toContain("import 'external/styles.css'")
  })
})

describe('cleanupCssOutputPlugin() — Vite hash marker removal', () => {
  it('removes the leftover Vite hash-update marker from CSS assets', () => {
    const bundle = {
      'index.css': {
        type: 'asset',
        // mirrors the real CDN output, where the marker leaks onto a trailing line
        source: '#sanity{--static-css-file-loaded-studio:true}\n/*$vite$:1*/',
      },
    } as any

    runPlugin(bundle)

    expect(bundle['index.css'].source).not.toContain('$vite$')
    expect(bundle['index.css'].source).toContain('#sanity{--static-css-file-loaded-studio:true}')
  })

  it('removes markers with any numeric suffix', () => {
    const bundle = {
      'index.css': {type: 'asset', source: 'body{}/*$vite$:42*/'},
    } as any

    runPlugin(bundle)

    expect(bundle['index.css'].source).toBe('body{}')
  })

  it('strips the marker from every CSS asset', () => {
    const bundle = {
      'index.css': {type: 'asset', source: 'body{}/*$vite$:1*/'},
      'theme.css': {type: 'asset', source: ':root{}/*$vite$:1*/'},
    } as any

    runPlugin(bundle)

    expect(bundle['index.css'].source).toBe('body{}')
    expect(bundle['theme.css'].source).toBe(':root{}')
  })

  // Rolldown only appends a single marker per file, so this can't happen in
  // practice — but it guards the regex's global flag: without `/g`, only the
  // first marker would be removed.
  it('removes every marker within a single CSS asset', () => {
    const bundle = {
      'index.css': {type: 'asset', source: 'a{}/*$vite$:1*/b{}/*$vite$:2*/'},
    } as any

    runPlugin(bundle)

    expect(bundle['index.css'].source).toBe('a{}b{}')
  })

  it('leaves CSS assets without the marker untouched', () => {
    const bundle = {
      'index.css': {type: 'asset', source: 'body{color:red}'},
    } as any

    runPlugin(bundle)

    expect(bundle['index.css'].source).toBe('body{color:red}')
  })

  it('does not touch non-string CSS asset sources', () => {
    const source = new Uint8Array([1, 2, 3])
    const bundle = {
      'index.css': {type: 'asset', source},
    } as any

    runPlugin(bundle)

    expect(bundle['index.css'].source).toBe(source)
  })

  it('does not introduce the marker into JS chunks', () => {
    const bundle = {
      'index.css': {type: 'asset', source: 'body{}/*$vite$:1*/'},
      'index.mjs': {type: 'chunk', code: 'export default {}\n'},
    } as any

    runPlugin(bundle)

    expect(bundle['index.css'].source).toBe('body{}')
    expect(bundle['index.mjs'].code).toBe('export default {}\n')
  })
})
