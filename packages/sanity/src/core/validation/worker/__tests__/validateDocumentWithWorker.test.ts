import {type SanityClient} from '@sanity/client'
import {type Rule, type SanityDocument, type ValidationContext} from '@sanity/types'
import {evaluateDocumentObservable, getFallbackLocaleSource} from '@sanity/validation/_internal'
import {lastValueFrom} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {
  evaluateDocumentWithWorker,
  mergeMarkers,
  type ValidationWorkerContext,
} from '../validateDocumentWithWorker'
import {createValidationWorkerHost} from '../validationWorkerHost'

const i18n = getFallbackLocaleSource()
const i18next = {
  language: 'en-US',
  getResourceBundle: () => undefined,
}

/**
 * A schema with one of everything the worker's manifest schema cannot carry: custom validators
 * (with and without a built-in sibling constraint, inside `either`, reading `context.hidden`),
 * `Rule.fields()`, a field reference, a slug with a custom `isUnique`, plus plenty the worker
 * does run: presence, lengths, uri, reference existence, unique arrays, Portable Text.
 */
function createTestSchema(spies: ReturnType<typeof createSpies>) {
  return createSchema({
    name: 'test',
    types: [
      {name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]},
      {
        name: 'article',
        type: 'document',
        fields: [
          {name: 'title', type: 'string', validation: (rule: Rule) => rule.required().min(3)},
          {
            name: 'slug',
            type: 'slug',
            options: {isUnique: spies.isUnique},
            validation: (rule: Rule) => rule.required(),
          },
          {
            name: 'link',
            type: 'object',
            fields: [
              {
                name: 'href',
                type: 'url',
                validation: (rule: Rule) =>
                  rule
                    .custom((url: string | undefined) => (url ? true : 'Link requires a URL'))
                    .uri({scheme: ['https']}),
              },
              {name: 'label', type: 'string', validation: (rule: Rule) => rule.max(5)},
            ],
          },
          {name: 'floor', type: 'number'},
          {
            name: 'count',
            type: 'number',
            validation: (rule: Rule) => rule.min(rule.valueOfField('floor')),
          },
          {
            name: 'range',
            type: 'object',
            fields: [
              {name: 'from', type: 'number'},
              {name: 'to', type: 'number'},
            ],
            validation: (rule: Rule) =>
              rule.fields({
                from: (fieldRule) => fieldRule.required(),
                to: (fieldRule) =>
                  fieldRule.custom((to: number | undefined, context: ValidationContext) => {
                    const from = (context.parent as {from?: number} | undefined)?.from
                    return to !== undefined && from !== undefined && to < from
                      ? 'Must not end before it starts'
                      : true
                  }),
              }),
          },
          {
            name: 'code',
            type: 'string',
            validation: (rule: Rule) =>
              rule.either([
                rule.custom((value: string | undefined) => value === 'secret' || 'Not secret'),
                rule.length(2),
              ]),
          },
          {
            name: 'secret',
            type: 'string',
            hidden: spies.hiddenCheck,
            validation: (rule: Rule) => rule.custom(spies.hiddenValidator),
          },
          {
            name: 'untouched',
            type: 'object',
            hidden: spies.untouchedHidden,
            fields: [{name: 'plain', type: 'string', validation: (rule: Rule) => rule.max(2)}],
          },
          {name: 'author', type: 'reference', to: [{type: 'author'}]},
          {
            name: 'tags',
            type: 'array',
            of: [{type: 'string'}],
            validation: (rule: Rule) => rule.unique().max(2),
          },
          {
            name: 'body',
            type: 'array',
            of: [
              {
                type: 'block',
                marks: {
                  annotations: [
                    {
                      name: 'mention',
                      type: 'object',
                      fields: [
                        {
                          name: 'handle',
                          type: 'string',
                          validation: (rule: Rule) =>
                            rule.custom((handle: string | undefined) =>
                              handle?.startsWith('@') ? true : 'Handles start with @',
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
      },
    ],
  })
}

function createDocument(): SanityDocument {
  return {
    _id: 'drafts.article',
    _type: 'article',
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    title: 'Hi',
    slug: {_type: 'slug', current: 'hello-world'},
    link: {_type: 'object', href: 'http://insecure.example', label: 'too long label'},
    floor: 10,
    count: 5,
    range: {_type: 'object', to: 1},
    code: 'abc',
    secret: 'visible?',
    untouched: {_type: 'object', plain: 'long'},
    author: {_type: 'reference', _ref: 'missing-author'},
    tags: ['a', 'a', 'b'],
    body: [
      {
        _type: 'block',
        _key: 'b1',
        style: 'normal',
        markDefs: [{_type: 'mention', _key: 'm1', handle: 'nobody'}],
        children: [{_type: 'span', _key: 's1', text: 'Hello', marks: ['m1']}],
      },
    ],
  } as SanityDocument
}

function createMockClient(fetch = vi.fn(async (): Promise<unknown> => true)) {
  const client = {
    fetch,
    getDataUrl: vi.fn(() => '/doc'),
    observable: {request: vi.fn()},
    withConfig: vi.fn(() => client),
  } as unknown as SanityClient
  return client
}

const sortMarkers = <T extends {path: unknown; code?: string; message: string}>(markers: T[]) =>
  markers.toSorted((a, b) =>
    `${JSON.stringify(a.path)}${a.code}${a.message}`.localeCompare(
      `${JSON.stringify(b.path)}${b.code}${b.message}`,
    ),
  )

/** Attaches the worker host to one end of a channel and hands the other end to the client. */
function createChannelWorker() {
  const channel = new MessageChannel()
  const detach = createValidationWorkerHost(channel.port2)
  channel.port1.start?.()
  channel.port2.start?.()
  return {
    port: channel.port1,
    close: () => {
      detach()
      channel.port1.close()
      channel.port2.close()
    },
  }
}

function createSpies() {
  return {
    isUnique: vi.fn(async () => false),
    hiddenValidator: vi.fn((_value: unknown, context: ValidationContext) =>
      context.hidden ? true : 'Only valid when hidden',
    ),
    hiddenCheck: vi.fn(() => true),
    untouchedHidden: vi.fn(() => false),
  }
}

describe('evaluateDocumentWithWorker', () => {
  const closers: Array<() => void> = []
  afterEach(() => {
    for (const close of closers.splice(0)) close()
    vi.restoreAllMocks()
  })

  it('produces the markers of the in-thread pipeline with built-in rules evaluated in the worker', async () => {
    const document = createDocument()
    const getDocumentExists = vi.fn(async ({id}: {id: string}) => id !== 'missing-author')

    const referenceSpies = createSpies()
    const referenceSchema = createTestSchema(referenceSpies)
    const expected = await lastValueFrom(
      evaluateDocumentObservable({
        document,
        schema: referenceSchema,
        i18n,
        getClient: () => createMockClient(),
        getDocumentExists,
        environment: 'studio',
      }),
    )
    expect(expected.markers.length).toBeGreaterThan(8)

    const spies = createSpies()
    const schema = createTestSchema(spies)
    const worker = createChannelWorker()
    closers.push(worker.close)
    const workerFetch = vi.fn(async (): Promise<unknown> => true)
    const ctx: ValidationWorkerContext = {
      schema,
      i18n,
      i18next,
      getClient: () => createMockClient(workerFetch),
      createWorker: () => worker.port,
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const result = await lastValueFrom(
      evaluateDocumentWithWorker(ctx, {document, getDocumentExists}),
    )

    expect(warn).not.toHaveBeenCalled()
    expect(sortMarkers(result.markers)).toEqual(sortMarkers(expected.markers))
    expect(result.status).toBe('failed')
    // the custom slug uniqueness ran once, on the main thread, and the worker did not query for it
    expect(spies.isUnique).toHaveBeenCalledOnce()
    expect(workerFetch).not.toHaveBeenCalled()
    // the custom validator saw the resolved `hidden` of its field
    expect(spies.hiddenValidator).toHaveBeenCalledOnce()
    expect(spies.hiddenValidator.mock.calls[0][1].hidden).toBe(true)
    // a subtree without rules for the main thread is not visited there
    expect(spies.untouchedHidden).not.toHaveBeenCalled()
    // reference existence was answered by the main thread for the worker
    expect(getDocumentExists).toHaveBeenCalledWith(expect.objectContaining({id: 'missing-author'}))
  })

  it('falls back to the main thread when the worker cannot be set up', async () => {
    const document = createDocument()
    const getDocumentExists = vi.fn(async () => true)
    const spies = createSpies()
    const schema = createTestSchema(spies)
    const expected = await lastValueFrom(
      evaluateDocumentObservable({
        document,
        schema,
        i18n,
        getClient: () => createMockClient(),
        getDocumentExists,
        environment: 'studio',
      }),
    )
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const result = await lastValueFrom(
      evaluateDocumentWithWorker(
        {
          schema,
          i18n,
          i18next,
          getClient: () => createMockClient(),
          createWorker: () => {
            throw new Error('no workers here')
          },
        },
        {document, getDocumentExists},
      ),
    )

    expect(warn).toHaveBeenCalledWith(
      'Validation worker unavailable, validating on the main thread instead:',
      expect.any(Error),
    )
    expect(sortMarkers(result.markers)).toEqual(sortMarkers(expected.markers))
  })

  it('cancels the worker run when the subscriber goes away', async () => {
    const spies = createSpies()
    const schema = createTestSchema(spies)
    const worker = createChannelWorker()
    closers.push(worker.close)
    const posted: unknown[] = []
    const originalPost = worker.port.postMessage.bind(worker.port)
    worker.port.postMessage = (message: unknown) => {
      posted.push(message)
      originalPost(message)
    }
    let resolveExists: (value: boolean) => void = () => undefined
    const getDocumentExists = vi.fn(
      () => new Promise<boolean>((resolve) => (resolveExists = resolve)),
    )

    const subscription = evaluateDocumentWithWorker(
      {schema, i18n, i18next, getClient: () => createMockClient(), createWorker: () => worker.port},
      {document: createDocument(), getDocumentExists},
    ).subscribe()
    await vi.waitFor(() => expect(getDocumentExists).toHaveBeenCalled())

    subscription.unsubscribe()
    resolveExists(true)

    await vi.waitFor(() => expect(posted).toContainEqual(expect.objectContaining({type: 'cancel'})))
  })
})

describe('mergeMarkers', () => {
  it('keeps a marker both sides produced once and preserves distinct ones', () => {
    const shared = {level: 'error' as const, code: 'x', message: 'm', path: ['a']}
    const merged = mergeMarkers(
      [shared, {level: 'warning', code: 'y', message: 'n', path: ['b']}],
      [{...shared}, {level: 'error', message: 'o', path: ['c']}],
    )
    expect(merged).toHaveLength(3)
    expect(merged[2]).toMatchObject({code: 'validation.failed', path: ['c']})
  })
})
