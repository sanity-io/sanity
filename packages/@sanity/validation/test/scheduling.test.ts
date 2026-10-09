import {type SanityClient} from '@sanity/client'
import {Schema as SchemaBuilder} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type Rule, type SanityDocument, type SchemaTypeDefinition} from '@sanity/types'
import {lastValueFrom, of} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

/**
 * `@sanity/validation` binds `requestIdleCallback` at import time, so each test stubs `window`
 * first and imports a fresh copy of the package.
 */

const builtinSchema = SchemaBuilder.compile({name: 'studio', types: builtinTypes})

const articleType: SchemaTypeDefinition = {
  type: 'document',
  name: 'article',
  fields: [
    {type: 'string', name: 'title', validation: (rule: Rule) => rule.required().min(3)},
    {
      type: 'array',
      name: 'text',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                type: 'object',
                name: 'link',
                fields: [
                  {
                    type: 'url',
                    name: 'href',
                    validation: (rule: Rule) =>
                      rule.custom((url: string | undefined) =>
                        url ? true : 'Link requires a URL',
                      ),
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  ],
}

function createDocument(blockCount: number): SanityDocument {
  return {
    _id: 'drafts.article',
    _type: 'article',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _rev: 'rev',
    title: 'Hi',
    text: Array.from({length: blockCount}, (_, index) => ({
      _type: 'block',
      _key: `block${index}`,
      style: 'normal',
      markDefs: index % 10 === 0 ? [{_type: 'link', _key: `link${index}`, href: ''}] : [],
      children: [
        {_type: 'span', _key: `span${index}`, text: `Paragraph ${index}`, marks: []},
        ...(index % 10 === 0
          ? [{_type: 'span', _key: `span${index}b`, text: 'link', marks: [`link${index}`]}]
          : []),
      ],
    })),
  } as SanityDocument
}

function createMockClient() {
  const client = {
    fetch: vi.fn(async (): Promise<unknown> => null),
    getDataUrl: vi.fn(() => '/doc'),
    observable: {request: vi.fn(() => of({omitted: []}))},
    withConfig: vi.fn(() => client),
  } as unknown as SanityClient
  return client
}

/** Models a page that never runs idle callbacks, such as a hidden tab or a saturated main thread. */
function createStalledPage() {
  let nextHandle = 1
  return {
    requestIdleCallback: vi.fn((): number => nextHandle++),
    cancelIdleCallback: vi.fn(),
  }
}

/** Models an idle page: idle callbacks run in the next macrotask. */
function createIdlePage() {
  return {
    requestIdleCallback: vi.fn(
      (callback: IdleRequestCallback): number =>
        setTimeout(
          () => callback({didTimeout: false, timeRemaining: () => 50}),
          0,
        ) as unknown as number,
    ),
    cancelIdleCallback: vi.fn((handle: number) => clearTimeout(handle)),
  }
}

async function importValidation(page: {requestIdleCallback: unknown; cancelIdleCallback: unknown}) {
  vi.resetModules()
  vi.stubGlobal('window', page)
  return import('../src/_internal')
}

const sortMarkers = <T extends {path: unknown; message: string}>(markers: T[]) =>
  markers.toSorted((a, b) =>
    `${JSON.stringify(a.path)}${a.message}`.localeCompare(`${JSON.stringify(b.path)}${b.message}`),
  )

describe('validation scheduling', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('waits for idle callbacks by default', async () => {
    const page = createStalledPage()
    const {evaluateDocumentObservable, getFallbackLocaleSource} = await importValidation(page)
    const schema = SchemaBuilder.compile({
      name: 'test',
      parent: builtinSchema,
      types: [articleType],
    })

    const outcome = await Promise.race([
      lastValueFrom(
        evaluateDocumentObservable({
          document: createDocument(20),
          schema,
          getClient: () => createMockClient(),
          i18n: getFallbackLocaleSource(),
          environment: 'studio',
        }),
      ).then(() => 'completed'),
      new Promise<string>((resolve) => setTimeout(() => resolve('still validating'), 500)),
    ])

    expect(outcome).toBe('still validating')
    expect(page.requestIdleCallback).toHaveBeenCalled()
  })

  it('completes without a single idle callback when scheduling is immediate', async () => {
    const page = createStalledPage()
    const {evaluateDocumentObservable, getFallbackLocaleSource} = await importValidation(page)
    const schema = SchemaBuilder.compile({
      name: 'test',
      parent: builtinSchema,
      types: [articleType],
    })

    const result = await lastValueFrom(
      evaluateDocumentObservable({
        document: createDocument(200),
        schema,
        getClient: () => createMockClient(),
        i18n: getFallbackLocaleSource(),
        environment: 'studio',
        scheduling: 'immediate',
      }),
    )

    expect(page.requestIdleCallback).not.toHaveBeenCalled()
    expect(result.status).toBe('failed')
    // the required/min title rule plus every empty link href
    expect(result.markers).toHaveLength(1 + 20)
  })

  it('produces the same markers with either scheduling', async () => {
    const document = createDocument(60)
    const idlePage = createIdlePage()
    const idleModule = await importValidation(idlePage)
    const idleSchema = SchemaBuilder.compile({
      name: 'test',
      parent: builtinSchema,
      types: [articleType],
    })
    const idle = await lastValueFrom(
      idleModule.evaluateDocumentObservable({
        document,
        schema: idleSchema,
        getClient: () => createMockClient(),
        i18n: idleModule.getFallbackLocaleSource(),
        environment: 'studio',
      }),
    )

    const immediateModule = await importValidation(createStalledPage())
    const immediateSchema = SchemaBuilder.compile({
      name: 'test',
      parent: builtinSchema,
      types: [articleType],
    })
    const immediate = await lastValueFrom(
      immediateModule.evaluateDocumentObservable({
        document,
        schema: immediateSchema,
        getClient: () => createMockClient(),
        i18n: immediateModule.getFallbackLocaleSource(),
        environment: 'studio',
        scheduling: 'immediate',
      }),
    )

    expect(idlePage.requestIdleCallback).toHaveBeenCalled()
    expect(immediate.status).toBe(idle.status)
    expect(sortMarkers(immediate.markers)).toEqual(sortMarkers(idle.markers))
  })
})
