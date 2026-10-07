import {type SanityClient} from '@sanity/client'
import {Schema as SchemaBuilder} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type Rule, type SanityDocument, type SchemaTypeDefinition} from '@sanity/types'
import {of} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

/**
 * These tests cover how validation work is paced over `requestIdleCallback`, so they control the
 * idle callback API the package binds at import time: each test stubs `window` first and then
 * imports a fresh copy of the package.
 */

const builtinSchema = SchemaBuilder.compile({name: 'studio', types: builtinTypes})

function createSchema(types: SchemaTypeDefinition[]) {
  return SchemaBuilder.compile({name: 'test', parent: builtinSchema, types})
}

// A Portable Text document type with an annotation that runs a custom validator, the shape of
// the document that first surfaced the stall (block -> children/markDefs -> span/link -> fields).
const articleType: SchemaTypeDefinition = {
  type: 'document',
  name: 'article',
  fields: [
    {type: 'string', name: 'title'},
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
                  {type: 'boolean', name: 'newTab'},
                ],
              },
            ],
          },
        },
      ],
    },
  ],
}

function createPortableTextDocument(blockCount: number, {brokenLinks = 0} = {}): SanityDocument {
  const text = Array.from({length: blockCount}, (_, index) => {
    const linkKey = `link${index}`
    const hasLink = index % 10 === 0
    return {
      _type: 'block',
      _key: `block${index}`,
      style: 'normal',
      markDefs: hasLink
        ? [
            {
              _type: 'link',
              _key: linkKey,
              href: index < brokenLinks * 10 ? '' : 'https://sanity.io',
            },
          ]
        : [],
      children: [
        {_type: 'span', _key: `span${index}a`, text: `Paragraph ${index}`, marks: []},
        ...(hasLink
          ? [{_type: 'span', _key: `span${index}b`, text: 'a link', marks: [linkKey]}]
          : []),
      ],
    }
  })
  return {
    _id: 'drafts.article',
    _type: 'article',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    _rev: 'rev',
    title: 'Article',
    text,
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

interface IdleEnvironment {
  requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
  cancelIdleCallback: (handle: number) => void
}

/**
 * Models a background tab: the browser grants no idle periods, so a callback only ever runs when
 * its `timeout` expires. The timeout is modelled as the next macrotask so the test does not wait.
 */
function createBackgroundTab() {
  const timers = new Map<number, ReturnType<typeof setTimeout>>()
  let nextHandle = 1
  let withoutTimeout = 0
  const requestIdleCallback = vi.fn(
    (callback: IdleRequestCallback, options?: IdleRequestOptions): number => {
      const handle = nextHandle++
      if (options?.timeout) {
        timers.set(
          handle,
          setTimeout(() => {
            timers.delete(handle)
            callback({didTimeout: true, timeRemaining: () => 0})
          }, 0),
        )
      } else {
        withoutTimeout++
      }
      return handle
    },
  )
  const cancelIdleCallback = vi.fn((handle: number) => {
    clearTimeout(timers.get(handle))
    timers.delete(handle)
  })
  return {
    requestIdleCallback,
    cancelIdleCallback,
    get withoutTimeout() {
      return withoutTimeout
    },
  }
}

/** Models a page that never gets around to running idle callbacks at all. */
function createStalledPage() {
  let nextHandle = 1
  return {
    requestIdleCallback: vi.fn((): number => nextHandle++),
    cancelIdleCallback: vi.fn(),
  }
}

/** Models an idle page: each callback runs in the next macrotask with a full idle period. */
function createIdlePage(idlePeriodMs = 50) {
  let nextHandle = 1
  const timers = new Map<number, ReturnType<typeof setTimeout>>()
  const requestIdleCallback = vi.fn((callback: IdleRequestCallback): number => {
    const handle = nextHandle++
    timers.set(
      handle,
      setTimeout(() => {
        timers.delete(handle)
        const start = performance.now()
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, idlePeriodMs - (performance.now() - start)),
        })
      }, 0),
    )
    return handle
  })
  const cancelIdleCallback = vi.fn((handle: number) => {
    clearTimeout(timers.get(handle))
    timers.delete(handle)
  })
  return {requestIdleCallback, cancelIdleCallback}
}

async function importValidation(
  environment: IdleEnvironment,
  {hidden = false}: {hidden?: boolean} = {},
) {
  vi.resetModules()
  vi.stubGlobal('window', {
    requestIdleCallback: environment.requestIdleCallback,
    cancelIdleCallback: environment.cancelIdleCallback,
  })
  vi.stubGlobal('document', {visibilityState: hidden ? 'hidden' : 'visible'})
  return import('../src')
}

function raceWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T | 'timed out'> {
  return Promise.race([
    promise,
    new Promise<'timed out'>((resolve) => setTimeout(() => resolve('timed out'), ms)),
  ])
}

describe('validation idle scheduling', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('completes in a background tab that grants no idle periods', async () => {
    const tab = createBackgroundTab()
    const {validateDocument} = await importValidation(tab)

    const result = await raceWithTimeout(
      validateDocument({
        client: createMockClient(),
        document: createPortableTextDocument(200, {brokenLinks: 3}),
        schema: createSchema([articleType]),
      }),
      4_000,
    )

    expect(result).not.toBe('timed out')
    expect(result).toMatchObject({status: 'failed', markers: expect.any(Array)})
    expect(tab.withoutTimeout).toBe(0)
    expect(tab.requestIdleCallback.mock.calls.length).toBeGreaterThan(0)
  })

  it('runs without idle callbacks while the document is hidden', async () => {
    const page = createStalledPage()
    const {validateDocument} = await importValidation(page, {hidden: true})

    const result = await raceWithTimeout(
      validateDocument({
        client: createMockClient(),
        document: createPortableTextDocument(200),
        schema: createSchema([articleType]),
      }),
      4_000,
    )

    expect(result).toEqual({status: 'passed', markers: []})
    expect(page.requestIdleCallback).not.toHaveBeenCalled()
  })

  it('needs a number of idle periods that follows the work, not the number of nodes', async () => {
    const page = createIdlePage(Number.POSITIVE_INFINITY)
    const {validateDocument} = await importValidation(page)

    const result = await validateDocument({
      client: createMockClient(),
      document: createPortableTextDocument(1000),
      schema: createSchema([articleType]),
    })

    expect(result).toEqual({status: 'passed', markers: []})
    // ~20,000 nodes, one idle period: everything that becomes ready while the period lasts runs in it
    expect(page.requestIdleCallback).toHaveBeenCalledOnce()
  })

  it('produces the same markers whether the work is sliced or run inline', async () => {
    const document = createPortableTextDocument(120, {brokenLinks: 4})
    const schema = createSchema([articleType])

    const {validateDocument: validateSliced} = await importValidation(createIdlePage(1))
    const sliced = await validateSliced({client: createMockClient(), document, schema})

    const {validateDocument: validateInline} = await importValidation(createStalledPage(), {
      hidden: true,
    })
    const inline = await validateInline({client: createMockClient(), document, schema})

    expect(sliced.markers).toHaveLength(4)
    expect(sliced.markers.map((marker) => marker.path)).toEqual(
      expect.arrayContaining([
        ['text', {_key: 'block0'}, 'markDefs', {_key: 'link0'}, 'href'],
        ['text', {_key: 'block30'}, 'markDefs', {_key: 'link30'}, 'href'],
      ]),
    )
    // markers are collected in completion order, which depends on how the work was sliced
    const byPath = (markers: typeof sliced.markers) =>
      markers.toSorted((a, b) => JSON.stringify(a.path).localeCompare(JSON.stringify(b.path)))
    expect(inline.status).toBe(sliced.status)
    expect(byPath(inline.markers)).toEqual(byPath(sliced.markers))
  })

  it('cancels the pending idle callback when validation is aborted', async () => {
    const page = createStalledPage()
    const {validateDocument} = await importValidation(page)
    const controller = new AbortController()
    const reason = new Error('cancelled')

    const validation = validateDocument({
      client: createMockClient(),
      document: createPortableTextDocument(10),
      schema: createSchema([articleType]),
      signal: controller.signal,
    })
    await vi.waitFor(() => expect(page.requestIdleCallback).toHaveBeenCalledOnce())
    controller.abort(reason)

    await expect(validation).rejects.toBe(reason)
    expect(page.cancelIdleCallback).toHaveBeenCalledWith(
      page.requestIdleCallback.mock.results[0].value,
    )
  })
})
