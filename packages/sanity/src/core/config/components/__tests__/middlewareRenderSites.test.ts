import {readdirSync, readFileSync} from 'node:fs'
import {join, relative} from 'node:path'

import {describe, expect, it} from 'vitest'

/**
 * `useMiddlewareComponents` returns a component with no Suspense boundary of its own, so every
 * site that renders one either wraps it or deliberately lets an ancestor boundary catch it. This
 * walks the package source, finds each hook built on `useMiddlewareComponents`, each component
 * those hooks hand out, and checks that every JSX render of such a component sits inside a
 * `<Suspense>` element in the same file unless it is listed in `DEFERS_TO_ANCESTOR`.
 */

const SRC_ROOT = join(import.meta.dirname, '../../../..')
const MIDDLEWARE_HOOK = 'useMiddlewareComponents'

/**
 * Sites that render a middleware component without a boundary of their own. Form nodes have
 * unpredictable heights, so no fallback the form could pick fits; a lazy form component owns its
 * own `<Suspense>` sized for what it renders, and until it resolves it suspends up to the nearest
 * boundary that knows the shape: the per-block boundary the Portable Text `Compositor` keeps
 * around each top-level block (block, inline object and annotation components), or the single
 * boundary `FormBuilder` keeps around its root input (input, field and item components). The
 * navbar and its tool menu suspend up to `StudioLayout`'s loading screen, since the navbar's
 * height depends on what it renders. Adding a site here is a decision, not a default.
 */
const DEFERS_TO_ANCESTOR = [
  'core/form/inputs/PortableText/object/Plugins.tsx <RenderPlugins>',
  'core/form/inputs/arrays/ArrayOfObjectsInput/List/ListArrayInput.tsx <ItemComponent>',
  'core/form/studio/FormBuilder.tsx <Annotation>',
  'core/form/studio/FormBuilder.tsx <Block>',
  'core/form/studio/FormBuilder.tsx <Field>',
  'core/form/studio/FormBuilder.tsx <InlineBlock>',
  'core/form/studio/FormBuilder.tsx <Input>',
  'core/form/studio/FormBuilder.tsx <Item>',
  'core/form/studio/FormProvider.tsx <Annotation>',
  'core/form/studio/FormProvider.tsx <Block>',
  'core/form/studio/FormProvider.tsx <Field>',
  'core/form/studio/FormProvider.tsx <InlineBlock>',
  'core/form/studio/FormProvider.tsx <Input>',
  'core/form/studio/FormProvider.tsx <Item>',
  'core/studio/StudioLayoutComponent.tsx <Navbar>',
  'core/studio/components/navbar/StudioNavbar.tsx <ToolMenu>',
  'core/studio/components/navbar/navDrawer/NavDrawer.tsx <ToolMenu>',
]

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

const sources = new Map<string, string>()

/** Source with comments blanked out, so `<Suspense>` in prose does not count as a boundary. */
function read(file: string) {
  let source = sources.get(file)
  if (source === undefined) {
    source = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, blankOutPreservingLines)
      .replace(/\/\/.*$/gm, blankOutPreservingLines)
    sources.set(file, source)
  }
  return source
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

  it('wraps every rendered middleware component in a Suspense boundary unless it defers to an ancestor', () => {
    const rendered = sites.filter(rendersInFile)
    const label = (site: RenderSite) => `${site.file} <${site.component}>`
    const unwrapped = rendered.filter((site) => unwrappedRenders(site).length > 0).map(label)
    const wrapped = rendered.filter((site) => unwrappedRenders(site).length === 0).map(label)

    expect(wrapped).toEqual(
      expect.arrayContaining([
        'core/studio/StudioLayout.tsx <Layout>',
        'core/studio/StudioLayoutComponent.tsx <ActiveToolLayout>',
        'structure/panes/document/DocumentPane.tsx <DocumentLayout>',
        'structure/diffView/components/DiffViewPane.tsx <DocumentLayout>',
      ]),
    )
    // Exact match both ways: a new unwrapped site must be added here on purpose, and a site that
    // gains its own boundary must be removed so the list stays true.
    expect(unwrapped.toSorted()).toEqual(DEFERS_TO_ANCESTOR)
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
