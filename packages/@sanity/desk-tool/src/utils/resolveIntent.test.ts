import {SerializeError} from '@sanity/structure'
import {PaneNode, UnresolvedPaneNode} from '../types'
import S from '../structure-builder'
import {resolveIntent} from './resolveIntent'
import {PaneResolutionError} from './PaneResolutionError'

jest.mock('part:@sanity/base/schema', () => {
  const createSchema = jest.requireActual('part:@sanity/base/schema-creator')

  return createSchema({
    name: 'mockSchema',
    types: [
      {
        name: 'book',
        title: 'Book',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      },
      {
        name: 'movie',
        title: 'Movie',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      },
      {
        name: 'author',
        title: 'Author',
        type: 'document',
        fields: [{name: 'name', type: 'string'}],
      },
      {
        name: 'settings',
        title: 'Settings',
        type: 'document',
        fields: [{name: 'toggle', type: 'boolean'}],
      },
    ],
  })
})

describe('resolveIntent', () => {
  it('takes in an intent request and returns `RouterPanes` that match the request', async () => {
    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.documentTypeListItem('author').title('Cool Authors'),
        S.divider(),
        S.documentTypeListItem('book').id('altBookId').title('Sick Books'),
        S.documentTypeListItem('movie').title('Rad Movies'),
      ]) as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'book123', type: 'book'},
      payload: undefined,
      rootPaneNode,
    })

    expect(routerPanes).toEqual([
      [{id: 'altBookId'}],
      [{id: 'book123', params: {}, payload: undefined}],
    ])
  })

  it('resolves singletons', async () => {
    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.documentTypeListItem('book').title('Books'),
        S.documentTypeListItem('movie').title('Movies'),
        S.divider(),
        S.documentListItem()
          .title('Settings')
          .schemaType('settings')
          .child(S.document().documentId('settings').schemaType('settings')),
      ]) as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'settings', type: 'settings'},
      payload: undefined,
      rootPaneNode,
    })

    expect(routerPanes).toEqual([[{id: 'settings', params: {}, payload: undefined}]])
  })

  it('resolves nested singletons', async () => {
    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.documentTypeListItem('book').title('Books'),
        S.documentTypeListItem('movie').title('Movies'),
        S.divider(),
        S.listItem()
          .title('Deep')
          .child(
            S.list()
              .title('Nested List')
              .items([
                S.listItem()
                  .title('Deeper')
                  .child(
                    S.list()
                      .title('Even More Nested List')
                      .items([
                        S.documentListItem()
                          .title('Settings')
                          .schemaType('settings')
                          .child(S.document().documentId('settings').schemaType('settings')),
                      ])
                  ),
              ])
          ),
      ]) as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'settings', type: 'settings'},
      payload: undefined,
      rootPaneNode,
    })

    expect(routerPanes).toEqual([
      [{id: 'deep'}],
      [{id: 'deeper'}],
      [{id: 'settings', params: {}, payload: undefined}],
    ])
  })

  it('returns the shallowest match', async () => {
    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.listItem()
          .title('Deep')
          .child(
            S.list()
              .title('Nested List')
              .items([
                S.listItem()
                  .title('Deeper')
                  .child(
                    S.list()
                      .title('Even More Nested List')
                      .items([
                        S.documentListItem()
                          .title('Settings')
                          .schemaType('settings')
                          .child(S.document().documentId('settings').schemaType('settings')),
                      ])
                  ),
              ])
          ),
        S.listItem()
          .title('Not so deep')
          .child(
            S.list()
              .title('Nested List')
              .items([
                S.documentListItem()
                  .title('Settings')
                  .schemaType('settings')
                  .child(S.document().documentId('settings').schemaType('settings')),
              ])
          ),
      ]) as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'settings', type: 'settings'},
      payload: undefined,
      rootPaneNode,
    })

    expect(routerPanes).toEqual([
      [{id: 'notSoDeep'}],
      [{id: 'settings', params: {}, payload: undefined}],
    ])
  })

  it('resolves to the fallback editor if no match is found', async () => {
    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.documentTypeListItem('book').id('altBookId').title('Sick Books'),
        S.documentTypeListItem('movie').title('Rad Movies'),
      ]) as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'author123', type: 'author'},
      payload: undefined,
      rootPaneNode,
    })

    expect(routerPanes).toEqual([
      [{id: '__edit__author123', params: {type: 'author'}, payload: undefined}],
    ])
  })

  it('matches document nodes that have the same ID as the target ID', async () => {
    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.documentListItem()
          .title('Settings')
          .schemaType('settings')
          .child(S.document().documentId('settings').schemaType('settings')),
      ])
      .serialize({path: []}) as PaneNode

    // this disables the default intent checker so we can try out matching
    // without relying on it
    const canHandleIntentSpy = jest.spyOn(rootPaneNode, 'canHandleIntent').mockReturnValue(false)

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'settings', type: 'settings'},
      payload: undefined,
      rootPaneNode,
    })

    expect(routerPanes).toEqual([[{id: 'settings', params: {}, payload: undefined}]])
    expect(canHandleIntentSpy).toHaveBeenCalled()
  })

  it('resolves pane nodes that implement `canHandleIntent`', async () => {
    const list = S.list()
      .canHandleIntent(() => true)
      .title('My List')
      .serialize()

    const canHandleIntentSpy = jest.spyOn(list, 'canHandleIntent')

    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.documentTypeListItem('book').title('Sick Books'),
        S.documentTypeListItem('movie').title('Rad Movies'),
        S.listItem().title('Some Item').child(list),
      ]) as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'author123', type: 'author'},
      payload: undefined,
      rootPaneNode,
    })

    expect(routerPanes).toEqual([
      [{id: 'someItem'}],
      [{id: 'author123', params: {}, payload: undefined}],
    ])

    expect(canHandleIntentSpy).toHaveBeenCalled()
    expect(canHandleIntentSpy.mock.calls).toMatchObject([
      [
        'edit',
        {id: 'author123', type: 'author'},
        {index: 1, pane: {id: 'myList', title: 'My List', type: 'list'}},
      ],
    ])
  })

  it('bubbles (re-throws) structure errors wrapped in a PaneResolutionError', async () => {
    const rootPaneNode = S.list().title('Content').items([
      // will give a missing ID error
      S.listItem(),
    ]) as UnresolvedPaneNode

    let caught = false

    try {
      await resolveIntent({
        intent: 'edit',
        params: {id: 'author123', type: 'author'},
        payload: undefined,
        rootPaneNode,
      })
    } catch (e) {
      caught = true
      expect(e.message).toEqual('`id` is required for list items')
      expect(e).toBeInstanceOf(PaneResolutionError)
      expect(e.cause).toBeInstanceOf(SerializeError)
    }

    expect(caught).toBe(true)
  })

  it('skips a searching a list if disableNestedIntentResolution is set', async () => {
    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.listItem()
          .title('Nested List 1')
          .child(
            S.list()
              .title('Nested List Disabled')
              .items([S.documentTypeListItem('book')])
              .disableNestedIntentResolution()
          ),
        S.listItem()
          .title('Nested List 2')
          .child(
            S.list()
              .title('Nested List Enabled')
              .items([S.documentTypeListItem('book')])
          ),
      ]) as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'book123', type: 'book'},
      payload: undefined,
      rootPaneNode,
    })

    expect(routerPanes).toMatchObject([
      // notice how it's list 2 instead of 1
      [{id: 'nestedList2'}],
      [{id: 'book'}],
      [{id: 'book123'}],
    ])
  })

  it('skips a searching a list and logs a warning if it has more than maxBranches', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
      // intentionally blank
    })

    const maxBranches = 5

    const rootPaneNode = S.list()
      .title('Content')
      .items(
        Array.from({length: 10}).map((_, i) =>
          S.listItem()
            .title(`Nested List ${i}`)
            .child(
              S.list()
                .title('Nested List')
                .items([S.documentTypeListItem('book')])
            )
        )
      ) as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'book123', type: 'book'},
      payload: undefined,
      rootPaneNode,
      maxBranches,
    })

    expect(routerPanes).toMatchObject(
      // the fallback editor
      [[{id: '__edit__book123'}]]
    )

    expect(consoleSpy.mock.calls).toEqual([
      [
        'Tried to resolve an intent within a pane that has over 5 items. ' +
          'This is unsupported at this time. To disable this warning call ' +
          '`S.list().disableNestedIntentResolution()` from list `content`',
      ],
    ])
    consoleSpy.mockRestore()
  })

  it('skips resolving a list item if it exceeds the maxPaneTimeout', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
      // intentionally blank
    })

    const maxPaneTimeout = 100

    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.listItem()
          .title('Nested List To Skip')
          .child(async () => {
            // wait double the timeout so it always times out
            await new Promise((resolve) => setTimeout(resolve, maxPaneTimeout * 2))

            return S.list()
              .title('Nested List')
              .items([S.documentTypeListItem('book')])
          }),
        S.listItem()
          .title('Nested List No Timeout')
          .child(
            S.list()
              .title('Nested List')
              .items([S.documentTypeListItem('book')])
          ),
      ]) as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'book123', type: 'book'},
      payload: undefined,
      rootPaneNode,
      maxPaneTimeout,
    })

    expect(routerPanes).toMatchObject([
      // notice it skipped the first
      [{id: 'nestedListNoTimeout'}],
      [{id: 'book'}],
      [{id: 'book123'}],
    ])

    expect(consoleSpy.mock.calls).toEqual([
      [
        'Pane `nestedListToSkip` at nestedListToSkip was skipped while resolving the intent because it took longer than 100ms.',
      ],
    ])
    consoleSpy.mockRestore()
  })

  it('skips resolving a list item if throws while resolving', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
      // intentionally blank
    })

    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.listItem()
          .title('Nested List To Skip')
          .child(() => {
            throw new Error('skipped')
          }),
        S.listItem()
          .title('Nested List No Throw')
          .child(
            S.list()
              .title('Nested List')
              .items([S.documentTypeListItem('book')])
          ),
      ]) as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'book123', type: 'book'},
      payload: undefined,
      rootPaneNode,
    })

    expect(routerPanes).toMatchObject([
      // notice it skipped the first
      [{id: 'nestedListNoThrow'}],
      [{id: 'book'}],
      [{id: 'book123'}],
    ])

    expect(consoleSpy.mock.calls).toMatchObject([
      [
        'Pane `nestedListToSkip` at nestedListToSkip threw while resolving the intent',
        {message: 'skipped'},
      ],
    ])
    consoleSpy.mockRestore()
  })

  it('returns the fallback editor if the maxTimeout is exceeded', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
      // intentionally blank
    })

    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.listItem()
          .title('Never resolves')
          .child(
            () =>
              new Promise(() => {
                // never resolves
              })
          ),
      ]) as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'book123', type: 'book'},
      payload: undefined,
      rootPaneNode,
      maxTimeout: 100,
    })

    // the fallback editor
    expect(routerPanes).toMatchObject([[{id: '__edit__book123'}]])

    expect(consoleSpy.mock.calls).toEqual([
      [
        'Intent resolver took longer than 100ms to resolve and timed out. ' +
          'This may be due a large or infinitely recursive structure. ' +
          'Falling back to the fallback editor…',
      ],
    ])
    consoleSpy.mockRestore()
  })
})
