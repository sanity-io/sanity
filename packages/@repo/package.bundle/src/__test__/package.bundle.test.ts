import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {lightningCssTargets, viteBuildTarget} from '@repo/browser-targets'
import {cssModulesPattern} from '@repo/css-modules-kit'
import {Features, transform} from 'lightningcss'
import {build, type PluginOption, type Rolldown} from 'vite'
import {describe, expect, it} from 'vitest'

import {
  cleanupCssOutputPlugin,
  createDefaultConfig,
  libraryEntryIds,
  type PreloadModulesOptions,
  preloadModulesPlugin,
  withPandaCssImport,
} from '../package.bundle'

function pluginNames(plugins: PluginOption): string[] {
  if (Array.isArray(plugins)) return plugins.flatMap(pluginNames)
  return plugins && typeof plugins === 'object' && 'name' in plugins ? [plugins.name] : []
}

const OPTIONS = {
  version: '9.9.9-test.1',
  browserslist: ['node >=24.11', 'baseline 2026 with downstream'],
}

describe('createDefaultConfig()', () => {
  it('injects the provided version as the __PKG_VERSION__ define', () => {
    const config = createDefaultConfig({...OPTIONS, styles: 'panda'})
    expect(config.define?.['__PKG_VERSION__']).toBe('"9.9.9-test.1"')
  })

  it('lowers the CSS for the browsers of the provided browserslist', () => {
    const config = createDefaultConfig({...OPTIONS, styles: 'panda'})
    expect(config.build?.cssTarget).toEqual(viteBuildTarget(OPTIONS.browserslist))
    expect(config.build?.target).toBeUndefined()
  })

  it('applies the styled-components transform with the JS target it builds for', async () => {
    const {build: buildOptions} = createDefaultConfig({...OPTIONS, styles: 'panda'})
    const root = await mkdtemp(path.join(tmpdir(), 'package-bundle-'))
    try {
      // Vite's Oxc plugin compiles TSX before Rolldown sees it, so plain JS is what Rolldown gets
      await writeFile(
        path.join(root, 'box.js'),
        "import {styled} from 'styled-components'\nexport const Box = styled.div`color: red;`\n",
      )
      const output = await build({
        root,
        configFile: false,
        logLevel: 'silent',
        build: {
          target: buildOptions?.target,
          write: false,
          minify: false,
          lib: {entry: 'box.js', formats: ['es']},
          rolldownOptions: {
            external: ['styled-components'],
            transform: buildOptions?.rolldownOptions?.transform,
          },
        },
      })
      const [{output: chunks}] = [output].flat() as Rolldown.RolldownOutput[]
      expect(chunks[0].code).toContain('withConfig')
    } finally {
      await rm(root, {recursive: true, force: true})
    }
  })

  it('excludes the Lightning CSS light-dark polyfill', () => {
    const config = createDefaultConfig({...OPTIONS, styles: 'panda'})
    expect(config.css?.lightningcss?.exclude).toBe(Features.LightDark)
  })

  it('compiles the .css.ts modules of a Panda package with Panda only', () => {
    const names = pluginNames(createDefaultConfig({...OPTIONS, styles: 'panda'}).plugins)
    expect(names).toEqual(
      expect.arrayContaining([
        'pandacss',
        'sanity:remove-cascade-layers',
        'sanity/panda-css-import',
        'sanity/cleanup-css-output',
      ]),
    )
  })

  it('compiles the CSS modules of a CSS modules package with Lightning CSS and no Panda', () => {
    const config = createDefaultConfig({...OPTIONS, styles: 'css-modules'})
    expect(config.css).toEqual({
      transformer: 'lightningcss',
      lightningcss: {cssModules: {pattern: cssModulesPattern}, exclude: Features.LightDark},
    })
    const names = pluginNames(config.plugins)
    expect(names).toContain('sanity/cleanup-css-output')
    expect(names).not.toContain('pandacss')
    expect(names).not.toContain('sanity:remove-cascade-layers')
    expect(names).not.toContain('sanity/panda-css-import')
  })
})

describe('createDefaultConfig() preload', () => {
  it('has no preload plugin unless the package asks for a list', () => {
    expect(pluginNames(createDefaultConfig({...OPTIONS, styles: 'panda'}).plugins)).not.toContain(
      'sanity/preload-modules',
    )
    expect(
      pluginNames(
        createDefaultConfig({
          ...OPTIONS,
          styles: 'panda',
          preload: {entry: 'index', lazyBoundaries: ['./boundary.js']},
        }).plugins,
      ),
    ).toContain('sanity/preload-modules')
  })
})

describe('preloadModulesPlugin()', () => {
  const READS_LIST =
    "export const list = typeof __SANITY_PRELOAD_MODULES__ === 'undefined' ? undefined : __SANITY_PRELOAD_MODULES__\n"
  const FILES = {
    'index.js':
      "import {list} from './list.js'\nexport {list}\nexport const boundary = () => import('./boundary.js')\nexport const tool = () => import('./tool.js')\nexport {shared} from './shared.js'\n",
    'list.js': READS_LIST,
    'shared.js': "export const shared = 'shared'\n",
    'boundary.js':
      "import {shared} from './shared.js'\nimport {dep} from './dep.js'\nexport const boundary = shared + dep()\nexport const tool = () => import('./tool.js')\n",
    'dep.js': "export function dep() { return 'dep' }\n",
    'tool.js': "import {dep} from './dep.js'\nexport const tool = dep() + 'tool'\n",
    'other.js': "export function other() { return 'other' }\n",
  }
  const OPTIONS_FOR_FILES: PreloadModulesOptions = {
    entry: 'index',
    lazyBoundaries: ['./boundary.js'],
  }

  async function buildFixture(
    files: Record<string, string>,
    preload: PreloadModulesOptions = OPTIONS_FOR_FILES,
  ) {
    const root = await mkdtemp(path.join(tmpdir(), 'package-bundle-preload-'))
    try {
      for (const [file, code] of Object.entries(files)) {
        await mkdir(path.dirname(path.join(root, file)), {recursive: true})
        await writeFile(path.join(root, file), code)
      }
      const output = await build({
        root,
        configFile: false,
        logLevel: 'silent',
        plugins: [preloadModulesPlugin(preload)],
        build: {
          write: false,
          minify: false,
          lib: {
            entry: {index: './index.js', other: './other.js'},
            formats: ['es'],
          },
        },
      })
      return [output].flat().flatMap((result) => ('output' in result ? result.output : []))
    } finally {
      await rm(root, {recursive: true, force: true})
    }
  }

  function preloadList(output: Awaited<ReturnType<typeof buildFixture>>): string[] {
    const index = output.find((chunk) => chunk.type === 'chunk' && chunk.fileName === 'index.mjs')
    const match = index?.type === 'chunk' ? index.code.match(/\[\s*"\.\/[^\]]*\]/) : null
    return match ? JSON.parse(match[0]) : []
  }

  it('lists the chunks of the lazy boundary and its static imports, relative to the entry', async () => {
    const output = await buildFixture(FILES)
    const list = preloadList(output)

    expect(list).toHaveLength(2)
    expect(list.every((specifier) => /^\.\/[^/]+\.mjs$/.test(specifier))).toBe(true)
    const names = list.map((specifier) => specifier.slice(2))
    // the boundary and the dependency it shares with a tool, but neither the tool nor `shared`,
    // which the entry already loads
    const chunks = output.filter((chunk) => chunk.type === 'chunk')
    expect(chunks.map((chunk) => chunk.fileName)).toEqual(expect.arrayContaining(names))
    const modules = names.map((name) => chunks.find((chunk) => chunk.fileName === name)!.code)
    expect(modules.some((code) => code.includes("'dep'") || code.includes('"dep"'))).toBe(true)
    expect(modules.some((code) => code.includes('"tool"') || code.includes("'tool'"))).toBe(false)
    expect(modules.some((code) => code.includes('"shared"') || code.includes("'shared'"))).toBe(
      false,
    )
    expect(output.map((asset) => asset.fileName).filter((file) => file.endsWith('.json'))).toEqual(
      [],
    )
  })

  it('fails when an allowlisted module is no longer a chunk of its own', async () => {
    await expect(
      buildFixture({
        ...FILES,
        'index.js': `${FILES['index.js']}export {boundary as staticBoundary} from './boundary.js'\n`,
      }),
    ).rejects.toThrow(/boundary\.js is no longer a chunk of its own/)
  })

  it('fails when the list would reach into the chunk of another entry', async () => {
    await expect(
      buildFixture({
        ...FILES,
        'boundary.js': `import {other} from './other.js'\nexport const usesOther = other()\n${FILES['boundary.js']}`,
      }),
    ).rejects.toThrow(/would reach into the entry chunk/)
  })

  it('fails when the entry does not read the list', async () => {
    await expect(
      buildFixture({...FILES, 'list.js': "export const list = 'none'\n"}),
    ).rejects.toThrow(/exactly one chunk/)
  })
})

describe('pandaCssImportPlugin()', () => {
  it('resolves the library entries to module ids', () => {
    expect(
      libraryEntryIds('/repo/packages/sanity', {
        index: './src/_exports/index.ts',
        structure: './src/_exports/structure.ts',
      }),
    ).toEqual(
      new Set([
        '/repo/packages/sanity/src/_exports/index.ts',
        '/repo/packages/sanity/src/_exports/structure.ts',
      ]),
    )
    expect(libraryEntryIds('/repo/packages/sanity', './src/index.ts')).toEqual(
      new Set(['/repo/packages/sanity/src/index.ts']),
    )
    expect(libraryEntryIds('/repo/packages/sanity', undefined)).toEqual(new Set())
  })

  it('imports the Panda stylesheet ahead of an entry module', () => {
    const pandaCss = fileURLToPath(new URL('../panda.css', import.meta.url))
    expect(withPandaCssImport('export {}')).toBe(`import ${JSON.stringify(pandaCss)}\nexport {}`)
  })
})

/**
 * Vite 8's default CSS minify target (`baseline-widely-available`): Chrome 111,
 * Edge 111, Firefox 114, Safari 16.4. Those browsers predate native `light-dark()`,
 * which makes them the targets that exercise the polyfill exclude.
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
    const config = createDefaultConfig({...OPTIONS, styles: 'panda'})
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

  it('preserves light-dark() for the Baseline 2026 browsers without the exclude', () => {
    const {code} = transform({
      filename: 'theme.css',
      code: Buffer.from(LIGHT_DARK_CSS),
      minify: true,
      targets: lightningCssTargets(OPTIONS.browserslist),
    })
    const css = code.toString()

    expect(css).toContain('light-dark(')
    expect(css).not.toContain('--lightningcss-light')
  })
})

describe('Panda --made-with-panda marker', () => {
  const PANDA_CSS_OUTPUT =
    ':root{--made-with-panda:"🐼"}#sanity{--static-css-file-loaded-studio:true}.sanity-HgOzd{display:flex}'

  // The options Vite's CSS minifier hands Lightning CSS (`minifyCSS` spreads `css.lightningcss`)
  function minifyLikeVite(styles: 'panda' | 'css-modules') {
    const {css} = createDefaultConfig({...OPTIONS, styles})
    return transform({
      ...css?.lightningcss,
      filename: 'index.css',
      code: Buffer.from(PANDA_CSS_OUTPUT),
      minify: true,
      targets: VITE_BASELINE_WIDELY_AVAILABLE_TARGETS,
    }).code.toString()
  }

  it('is dropped from the CDN stylesheet of a Panda package', () => {
    const css = minifyLikeVite('panda')
    expect(css).not.toContain('made-with-panda')
    expect(css).not.toContain(':root')
    expect(css).toContain('--static-css-file-loaded-studio')
    expect(css).toContain('.sanity-HgOzd')
  })

  it('leaves the custom properties of a CSS modules package alone', () => {
    expect(
      createDefaultConfig({...OPTIONS, styles: 'css-modules'}).css?.lightningcss?.unusedSymbols,
    ).toBeUndefined()
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
      // CSS asset produced by Panda CSS
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
