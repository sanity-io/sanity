import {type SanityClient} from '@sanity/client'
import {Schema as SchemaBuilder} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type Rule, type SanityDocument, type SchemaTypeDefinition} from '@sanity/types'
import {BehaviorSubject, lastValueFrom, of} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {validationMarkerCodes} from './codes'
import {type ValidationScheduling} from './util/pace'

/**
 * `@sanity/validation` binds `requestIdleCallback` at import time, so each test stubs `window`
 * first and imports a fresh copy of the package.
 */

function immediateScheduling() {
  return new BehaviorSubject<ValidationScheduling>('immediate')
}

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
    cancelIdleCallback: vi.fn((_handle: number) => undefined),
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

function createSchema() {
  return SchemaBuilder.compile({
    name: 'test',
    parent: builtinSchema,
    types: [articleType],
  })
}

/** Paths of the empty link hrefs `createDocument` inserts on every tenth block. */
function emptyLinkPaths(blockCount: number) {
  return Array.from({length: blockCount / 10}, (_, index) => {
    const blockIndex = index * 10
    return ['text', {_key: `block${blockIndex}`}, 'markDefs', {_key: `link${blockIndex}`}, 'href']
  })
}

async function importValidation(page: {requestIdleCallback: unknown; cancelIdleCallback: unknown}) {
  vi.resetModules()
  vi.stubGlobal('window', page)
  return import('./_internal')
}

type MarkerIdentity = {path: unknown; level: string; code: string; message: string}

function markerIdentity(marker: MarkerIdentity) {
  return JSON.stringify([marker.path, marker.level, marker.code, marker.message])
}

function sortMarkers<T extends MarkerIdentity>(markers: T[]): T[] {
  return markers.toSorted((a, b) => markerIdentity(a).localeCompare(markerIdentity(b)))
}

const byHandle = (left: number, right: number) => left - right

const TITLE_TOO_SHORT: MarkerIdentity = {
  path: ['title'],
  level: 'error',
  code: validationMarkerCodes.stringMinimumLength,
  message: 'Must be at least 3 characters long',
}

describe('validation scheduling', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('waits for idle callbacks by default and cancels them on unsubscribe', async () => {
    const page = createStalledPage()
    const {evaluateDocumentObservable, getFallbackLocaleSource} = await importValidation(page)
    const emissions: unknown[] = []
    const subscription = evaluateDocumentObservable({
      document: createDocument(20),
      schema: createSchema(),
      getClient: () => createMockClient(),
      i18n: getFallbackLocaleSource(),
      environment: 'studio',
    }).subscribe({
      next: (result) => {
        emissions.push(result)
      },
      error: (error: unknown) => {
        emissions.push(error)
      },
    })

    await vi.waitFor(() => {
      expect(page.requestIdleCallback).toHaveBeenCalled()
    })
    // The stalled page never runs callbacks, so a result here means validation did not wait.
    expect(emissions).toEqual([])
    expect(page.cancelIdleCallback).not.toHaveBeenCalled()
    expect(page.requestIdleCallback.mock.calls.length).toBeGreaterThan(1)

    subscription.unsubscribe()

    // Every scheduled handle was cancelled, and no other handle was.
    expect(page.cancelIdleCallback.mock.calls.map(([handle]) => handle).toSorted(byHandle)).toEqual(
      page.requestIdleCallback.mock.results.map((result) => result.value).toSorted(byHandle),
    )
  })

  it('yields to the browser now and then in an immediate run where it has scheduler.yield', async () => {
    const page = createStalledPage()
    const scheduler = {yield: vi.fn(() => Promise.resolve())}
    vi.stubGlobal('scheduler', scheduler)
    const {evaluateDocumentObservable, getFallbackLocaleSource} = await importValidation(page)

    const result = await lastValueFrom(
      evaluateDocumentObservable({
        document: createDocument(200),
        schema: createSchema(),
        getClient: () => createMockClient(),
        i18n: getFallbackLocaleSource(),
        environment: 'studio',
        scheduling: immediateScheduling(),
      }),
    )

    expect(page.requestIdleCallback).not.toHaveBeenCalled()
    // 200 blocks are a few thousand nodes: a yield per hundred of them, and far from one per node
    expect(scheduler.yield.mock.calls.length).toBeGreaterThan(5)
    expect(scheduler.yield.mock.calls.length).toBeLessThan(200)
    expect(result.status).toBe('failed')
    expect(result.markers).toHaveLength(1 + 20)
  })

  it('holds the whole immediate run while the browser has the thread', async () => {
    const page = createStalledPage()
    // a browser that never hands the thread back
    const scheduler = {yield: vi.fn(() => new Promise<void>(() => undefined))}
    vi.stubGlobal('scheduler', scheduler)
    const {evaluateDocumentObservable, getFallbackLocaleSource} = await importValidation(page)

    const outcome = await Promise.race([
      lastValueFrom(
        evaluateDocumentObservable({
          document: createDocument(200),
          schema: createSchema(),
          getClient: () => createMockClient(),
          i18n: getFallbackLocaleSource(),
          environment: 'studio',
          scheduling: immediateScheduling(),
        }),
      ).then(() => 'completed'),
      new Promise<string>((resolve) => setTimeout(() => resolve('still validating'), 300)),
    ])

    expect(outcome).toBe('still validating')
    // every node of the run waits for the one pending yield instead of asking for its own
    expect(scheduler.yield).toHaveBeenCalledTimes(1)
  })

  it('completes without a single idle callback when scheduling is immediate', async () => {
    const page = createStalledPage()
    vi.stubGlobal('scheduler', undefined)
    const {evaluateDocumentObservable, getFallbackLocaleSource} = await importValidation(page)
    const blockCount = 200

    const result = await lastValueFrom(
      evaluateDocumentObservable({
        document: createDocument(blockCount),
        schema: createSchema(),
        getClient: () => createMockClient(),
        i18n: getFallbackLocaleSource(),
        environment: 'studio',
        scheduling: immediateScheduling(),
      }),
    )

    const linkMarkers: MarkerIdentity[] = emptyLinkPaths(blockCount).map((path) => ({
      path,
      level: 'error',
      code: validationMarkerCodes.custom,
      message: 'Link requires a URL',
    }))

    expect(page.requestIdleCallback).not.toHaveBeenCalled()
    expect(result.status).toBe('failed')
    expect(sortMarkers(result.markers).map(markerIdentity)).toEqual(
      sortMarkers([TITLE_TOO_SHORT, ...linkMarkers]).map(markerIdentity),
    )
    expect(result.markers).toContainEqual(
      expect.objectContaining({
        ...TITLE_TOO_SHORT,
        details: {actualLength: 2, minimumLength: 3},
      }),
    )
  })

  it('finishes an idle run in flight once its scheduling switches to immediate', async () => {
    const page = createStalledPage()
    vi.stubGlobal('scheduler', {yield: vi.fn(() => Promise.resolve())})
    const {evaluateDocumentObservable, getFallbackLocaleSource} = await importValidation(page)
    const blockCount = 200
    const scheduling = new BehaviorSubject<ValidationScheduling>('idle')
    let settled = false
    const result = lastValueFrom(
      evaluateDocumentObservable({
        document: createDocument(blockCount),
        schema: createSchema(),
        getClient: () => createMockClient(),
        i18n: getFallbackLocaleSource(),
        environment: 'studio',
        scheduling,
      }),
    ).finally(() => {
      settled = true
    })

    await vi.waitFor(() => {
      expect(page.requestIdleCallback).toHaveBeenCalled()
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(settled).toBe(false)
    const requested = page.requestIdleCallback.mock.results.map(({value}) => value)

    scheduling.next('immediate')
    const {status, markers} = await result

    // The stalled page never ran an idle callback: the nodes that were waiting for one went ahead,
    // and nothing after the switch asked for one.
    expect(page.requestIdleCallback).toHaveBeenCalledTimes(requested.length)
    expect(page.cancelIdleCallback.mock.calls.map(([handle]) => handle).toSorted(byHandle)).toEqual(
      requested.toSorted(byHandle),
    )
    const linkMarkers: MarkerIdentity[] = emptyLinkPaths(blockCount).map((path) => ({
      path,
      level: 'error',
      code: validationMarkerCodes.custom,
      message: 'Link requires a URL',
    }))
    expect(status).toBe('failed')
    expect(sortMarkers(markers).map(markerIdentity)).toEqual(
      sortMarkers([TITLE_TOO_SHORT, ...linkMarkers]).map(markerIdentity),
    )
  })

  it('produces the same markers with either scheduling', async () => {
    const document = createDocument(60)
    const schema = createSchema()
    const idlePage = createIdlePage()
    const idleModule = await importValidation(idlePage)
    const idle = await lastValueFrom(
      idleModule.evaluateDocumentObservable({
        document,
        schema,
        getClient: () => createMockClient(),
        i18n: idleModule.getFallbackLocaleSource(),
        environment: 'studio',
      }),
    )

    const immediatePage = createStalledPage()
    const immediateModule = await importValidation(immediatePage)
    const immediate = await lastValueFrom(
      immediateModule.evaluateDocumentObservable({
        document,
        schema,
        getClient: () => createMockClient(),
        i18n: immediateModule.getFallbackLocaleSource(),
        environment: 'studio',
        scheduling: immediateScheduling(),
      }),
    )

    expect(idlePage.requestIdleCallback).toHaveBeenCalled()
    expect(immediatePage.requestIdleCallback).not.toHaveBeenCalled()
    expect(immediate.status).toBe(idle.status)
    expect(sortMarkers(immediate.markers)).toEqual(sortMarkers(idle.markers))
  })

  it.each([
    {browser: 'a browser without scheduler.yield', hasSchedulerYield: false},
    {browser: 'a browser with scheduler.yield', hasSchedulerYield: true},
  ])(
    'completes a long run of array items without rules when scheduling is immediate, in $browser',
    async ({hasSchedulerYield}) => {
      const page = createStalledPage()
      const scheduler = {yield: vi.fn(() => Promise.resolve())}
      vi.stubGlobal('scheduler', hasSchedulerYield ? scheduler : undefined)
      // what Node yields through where there is no scheduler.yield; stands in for Node's
      // setImmediate, which this package's types do not declare
      const setImmediate = vi.fn((callback: () => void) => setTimeout(callback, 0))
      vi.stubGlobal('setImmediate', setImmediate)
      const {evaluateDocumentObservable, getFallbackLocaleSource} = await importValidation(page)
      const schema = SchemaBuilder.compile({
        name: 'test',
        parent: builtinSchema,
        types: [
          {type: 'object', name: 'item', fields: [{type: 'string', name: 'title'}]},
          {type: 'object', name: 'other', fields: [{type: 'string', name: 'title'}]},
          {
            type: 'document',
            name: 'list',
            // Two member types, so items with an unknown `_type` resolve to no schema type (and no rules)
            fields: [{type: 'array', name: 'items', of: [{type: 'item'}, {type: 'other'}]}],
          },
        ],
      })
      // Enough items with rules to fill the 40-wide `mergeMap` window, then a run that completes synchronously
      const items = [
        ...Array.from({length: 45}, (_, index) => ({
          _type: 'item',
          _key: `item${index}`,
          title: 'a',
        })),
        ...Array.from({length: 5000}, (_, index) => ({_type: 'removed', _key: `removed${index}`})),
      ]

      const result = await lastValueFrom(
        evaluateDocumentObservable({
          document: {
            _id: 'drafts.list',
            _type: 'list',
            _createdAt: '2026-01-01T00:00:00.000Z',
            _updatedAt: '2026-01-01T00:00:00.000Z',
            _rev: 'rev',
            items,
          },
          schema,
          getClient: () => createMockClient(),
          i18n: getFallbackLocaleSource(),
          environment: 'studio',
          scheduling: immediateScheduling(),
        }),
      )

      expect(page.requestIdleCallback).not.toHaveBeenCalled()
      expect(scheduler.yield.mock.calls.length > 0).toBe(hasSchedulerYield)
      expect(setImmediate.mock.calls.length > 0).toBe(!hasSchedulerYield)
      expect(result).toEqual({status: 'passed', markers: []})
    },
  )
})
