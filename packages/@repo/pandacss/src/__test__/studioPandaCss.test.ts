import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {build, type Rolldown} from 'vite'
import {afterAll, beforeAll, describe, expect, test} from 'vitest'

import {LAYER_ORDER_STATEMENT} from '../layerOrder.ts'
import {PANDA_LAYER_NAMES, PANDA_LAYERS_CSS_SPECIFIER, studioPandaCss} from '../vite.ts'

const LAYERS_CSS_PATH = fileURLToPath(new URL('../layers.css', import.meta.url))

/**
 * Two Panda projects next to each other, the way `sanity` and the test studio's plugins meet in
 * one `sanity dev` server. Both fill the shared `layers.css` below the statement that declares
 * Panda's layer names; their class prefixes are their own, which is what tells their output apart.
 */
const PROJECTS = [
  {name: 'alpha', gap: '4px'},
  {name: 'beta', gap: '8px'},
] as const

type ProjectName = (typeof PROJECTS)[number]['name']

let root: string
const projectDirs = {} as Record<ProjectName, string>

async function writeProject({name, gap}: (typeof PROJECTS)[number]): Promise<string> {
  const dir = join(root, name)
  await mkdir(join(dir, 'src'), {recursive: true})
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify({
      name: `fixture-${name}`,
      private: true,
      type: 'module',
      imports: {'#styled-system/*': './styled-system/*/index.js'},
    }),
  )
  // A plain object instead of `defineConfig` + `satisfies Config`: the fixture is written to a
  // temporary directory where `@pandacss/dev` does not resolve, and nothing type-checks it.
  await writeFile(
    join(dir, 'panda.config.ts'),
    `export default {
  include: ['./src/**/*.css.ts'],
  importMap: '#styled-system',
  hash: true,
  prefix: '${name}',
  preflight: false,
  presets: [],
  jsxStyleProps: 'none',
  shorthands: false,
  forceImportExtension: true,
  strictPropertyValues: true,
}
`,
  )
  await writeFile(
    join(dir, 'src', 'box.css.ts'),
    `import {css} from '#styled-system/css'\n\nexport const box = css({display: 'flex', gap: '${gap}'})\n`,
  )
  return dir
}

function outputOf(result: Awaited<ReturnType<typeof build>>): Rolldown.RolldownOutput {
  const first = Array.isArray(result) ? result[0] : result
  if (!first || !('output' in first)) throw new Error('expected an in-memory build output')
  return first
}

function cssOf(output: Rolldown.RolldownOutput): string {
  return output.output
    .filter((item) => item.type === 'asset' && item.fileName.endsWith('.css'))
    .map((item) => (item.type === 'asset' ? item.source.toString() : ''))
    .join('\n')
}

/**
 * The one statement the studio still declares has to be the first rule of the stylesheet
 * (comments aside), and nothing else in it may mention a layer: `removeCascadeLayers()` unwraps
 * Panda's blocks and drops Panda's names from the declaration, leaving `sui`.
 */
function expectUnlayeredBehindStatement(css: string): void {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '').trimStart()
  expect(rules.startsWith(LAYER_ORDER_STATEMENT)).toBe(true)
  expect(rules.slice(LAYER_ORDER_STATEMENT.length)).not.toContain('@layer')
}

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'repo-pandacss-'))
  for (const project of PROJECTS) {
    projectDirs[project.name] = await writeProject(project)
  }
}, 30_000)

afterAll(async () => {
  await rm(root, {recursive: true, force: true})
})

test("layers.css opens with the studio's statement and declares Panda's layer names", async () => {
  // The first statement is the one layer the studio orders, which `removeCascadeLayers()` leaves
  // alone; the second is how `@pandacss/vite` recognizes the file as a project's root stylesheet
  const layersCss = await readFile(LAYERS_CSS_PATH, 'utf8')
  const statements = layersCss.match(/^@layer [^;]+;$/gm) ?? []
  expect(statements).toEqual([LAYER_ORDER_STATEMENT, `@layer ${PANDA_LAYER_NAMES.join(', ')};`])
})

describe('studioPandaCss()', () => {
  test(
    'rewrites each project with its own prefix and collects the CSS of both',
    {timeout: 60_000},
    async () => {
      const entry = join(root, 'entry.ts')
      await writeFile(
        entry,
        [
          `import ${JSON.stringify(LAYERS_CSS_PATH)}`,
          `export {box as alphaBox} from './alpha/src/box.css.ts'`,
          `export {box as betaBox} from './beta/src/box.css.ts'`,
          '',
        ].join('\n'),
      )

      const output = outputOf(
        await build({
          root,
          configFile: false,
          logLevel: 'silent',
          build: {
            write: false,
            minify: false,
            lib: {entry, formats: ['es'], fileName: 'entry'},
          },
          plugins: studioPandaCss({
            sanity: false,
            roots: [projectDirs.alpha, projectDirs.beta],
          }),
        }),
      )

      const chunk = output.output.find((item) => item.type === 'chunk')
      if (chunk?.type !== 'chunk') throw new Error('expected the entry chunk')
      // Without the per-project scope, the first instance rewrites both modules with its own
      // prefix (`alphaBox` and `betaBox` would both read `alpha-…`) while only the second
      // project's CSS carries the `beta-` rules — class names with no CSS behind them.
      const classNames = Object.fromEntries(
        [...chunk.code.matchAll(/var (box\$?\d?) = "([^"]+)"/g)].map(([, variable, names]) => [
          variable,
          names,
        ]),
      )
      const [alphaBox, betaBox] = Object.values(classNames)
      expect(alphaBox).toMatch(/^alpha-\w+ alpha-\w+$/)
      expect(betaBox).toMatch(/^beta-\w+ beta-\w+$/)
      expect(chunk.code).not.toContain('#styled-system')

      const css = cssOf(output)
      expectUnlayeredBehindStatement(css)
      expect(css).toMatch(/\.alpha-\w+\s*\{\s*gap:\s*4px/)
      expect(css).toMatch(/\.beta-\w+\s*\{\s*gap:\s*8px/)
    },
  )

  test(
    'a sanity build of the studio runtime entry loads the generated stylesheet',
    {timeout: 60_000},
    async () => {
      // What `sanity build` bundles: the `.sanity/runtime/app.js` the CLI writes, which imports
      // the studio's modules but no stylesheet of its own
      const appJs = join(root, '.sanity', 'runtime', 'app.js')
      await mkdir(join(root, '.sanity', 'runtime'), {recursive: true})
      await writeFile(
        appJs,
        `import {box} from '../../alpha/src/box.css.ts'\n\ndocument.body.className = box\n`,
      )

      const output = outputOf(
        await build({
          root,
          configFile: false,
          logLevel: 'silent',
          build: {write: false, minify: false, rolldownOptions: {input: appJs}},
          // The studio resolves the specifier through its own `@repo/pandacss` dependency
          resolve: {alias: {[PANDA_LAYERS_CSS_SPECIFIER]: LAYERS_CSS_PATH}},
          plugins: studioPandaCss({sanity: false, roots: [projectDirs.alpha]}),
        }),
      )

      const chunk = output.output.find((item) => item.type === 'chunk' && item.isEntry)
      if (chunk?.type !== 'chunk') throw new Error('expected the runtime entry chunk')
      expect(chunk.code).toMatch(/"alpha-\w+ alpha-\w+"/)

      const importedCss = [...(chunk.viteMetadata?.importedCss ?? [])]
      expect(importedCss).toHaveLength(1)
      const stylesheet = output.output.find((item) => item.fileName === importedCss[0])
      if (stylesheet?.type !== 'asset') throw new Error('expected the stylesheet asset')
      const css = stylesheet.source.toString()
      expectUnlayeredBehindStatement(css)
      expect(css).toMatch(/\.alpha-\w+\s*\{\s*gap:\s*4px/)
    },
  )
})
