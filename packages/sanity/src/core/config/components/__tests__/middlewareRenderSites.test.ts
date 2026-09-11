import {readdirSync, readFileSync} from 'node:fs'
import {join, relative} from 'node:path'

import {describe, expect, it} from 'vitest'

/**
 * `useMiddlewareComponents` returns a component with no Suspense boundary of its own, so every
 * site that renders one has to wrap it. This walks the package source, finds each hook built on
 * `useMiddlewareComponents`, each component those hooks hand out, and checks that every JSX
 * render of such a component sits inside a `<Suspense>` element in the same file.
 */

const SRC_ROOT = join(import.meta.dirname, '../../../..')
const MIDDLEWARE_HOOK = 'useMiddlewareComponents'

interface RenderSite {
  file: string
  hook: string
  component: string
}

interface Handoff extends RenderSite {
  prop: string
}

function sourceFiles(): string[] {
  return readdirSync(SRC_ROOT, {recursive: true, withFileTypes: true})
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => !/\.(test|stories|test-d)\.tsx?$/.test(file) && !file.includes('__tests__'))
}

function blankOutPreservingLines(text: string) {
  return text.replace(/[^\n]/g, ' ')
}

/** Source with comments blanked out, so `<Suspense>` in prose does not count as a boundary. */
function read(file: string) {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, blankOutPreservingLines)
    .replace(/\/\/.*$/gm, blankOutPreservingLines)
}

function middlewareHooks(files: string[]): string[] {
  const hooks = new Set([MIDDLEWARE_HOOK])
  for (const file of files) {
    const source = read(file)
    const match = /export function (use\w+Component)\b/.exec(source)
    if (match && source.includes(`${MIDDLEWARE_HOOK}(`)) {
      hooks.add(match[1])
    }
  }
  return [...hooks]
}

function renderSites(files: string[], hooks: string[]): RenderSite[] {
  const sites: RenderSite[] = []
  const declaration = new RegExp(`const (\\w+) = (${hooks.join('|')})\\(`, 'g')
  for (const file of files) {
    const source = read(file)
    for (const match of source.matchAll(declaration)) {
      sites.push({file: relative(SRC_ROOT, file), hook: match[2], component: match[1]})
    }
  }
  return sites
}

function suspenseDepthAt(source: string, index: number) {
  const before = source.slice(0, index)
  const opened = before.match(/<Suspense[\s>]/g)?.length ?? 0
  const closed = before.match(/<\/Suspense>/g)?.length ?? 0
  return opened - closed
}

function unwrappedRenders(site: RenderSite): number[] {
  const source = read(join(SRC_ROOT, site.file))
  const render = new RegExp(`<${site.component}(?=[\\s/>])`, 'g')
  return [...source.matchAll(render)]
    .filter((match) => suspenseDepthAt(source, match.index) === 0)
    .map((match) => source.slice(0, match.index).split('\n').length)
}

function rendersInFile(site: RenderSite) {
  return new RegExp(`<${site.component}(?=[\\s/>])`).test(read(join(SRC_ROOT, site.file)))
}

function handoffProp(site: RenderSite): string | undefined {
  const source = read(join(SRC_ROOT, site.file))
  return new RegExp(`(\\w+)=\\{${site.component}\\}`).exec(source)?.[1]
}

describe('middleware component render sites', () => {
  const files = sourceFiles()
  const hooks = middlewareHooks(files)
  const sites = renderSites(files, hooks)

  it('finds the hooks built on useMiddlewareComponents', () => {
    expect(hooks).toEqual(
      expect.arrayContaining(['useInputComponent', 'useLayoutComponent', 'useNavbarComponent']),
    )
  })

  it('finds the sites that render middleware components', () => {
    expect(sites).toEqual(
      expect.arrayContaining([
        {file: 'core/form/studio/FormBuilder.tsx', hook: 'useInputComponent', component: 'Input'},
        {file: 'core/studio/StudioLayout.tsx', hook: 'useLayoutComponent', component: 'Layout'},
        {
          file: 'structure/diffView/components/DiffViewPane.tsx',
          hook: MIDDLEWARE_HOOK,
          component: 'DocumentLayout',
        },
      ]),
    )
  })

  it('wraps every rendered middleware component in a Suspense boundary', () => {
    const rendered = sites.filter(rendersInFile)
    const unwrapped = rendered.flatMap((site) =>
      unwrappedRenders(site).map((line) => `${site.file}:${line} <${site.component}>`),
    )

    expect(rendered.map((site) => `${site.file} <${site.component}>`)).toEqual(
      expect.arrayContaining([
        'core/form/studio/FormBuilder.tsx <Input>',
        'core/form/studio/FormProvider.tsx <Field>',
        'core/form/inputs/arrays/ArrayOfObjectsInput/List/ListArrayInput.tsx <ItemComponent>',
        'core/studio/StudioLayoutComponent.tsx <Navbar>',
        'structure/panes/document/DocumentPane.tsx <DocumentLayout>',
      ]),
    )
    expect(unwrapped).toEqual([])
  })

  it('hands components it does not render to a component that owns the boundary', () => {
    const handoffs: Handoff[] = sites
      .filter((site) => !rendersInFile(site))
      .map((site) => ({...site, prop: handoffProp(site) ?? 'unused'}))

    expect(handoffs).toEqual([
      {
        file: 'core/form/studio/FormBuilder.tsx',
        hook: 'usePreviewComponent',
        component: 'Preview',
        prop: 'component',
      },
      {
        file: 'core/form/studio/FormProvider.tsx',
        hook: 'usePreviewComponent',
        component: 'Preview',
        prop: 'component',
      },
      {
        file: 'core/preview/components/Preview.tsx',
        hook: 'usePreviewComponent',
        component: 'PreviewComponent',
        prop: 'component',
      },
    ])
    expect(
      unwrappedRenders({
        file: 'core/preview/components/PreviewLoader.tsx',
        hook: 'usePreviewComponent',
        component: 'Component',
      }),
    ).toEqual([])
  })
})
