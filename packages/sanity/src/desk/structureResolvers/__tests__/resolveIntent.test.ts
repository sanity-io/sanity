import {PaneNode, UnresolvedPaneNode} from '../../types'
import {createStructureBuilder, SerializeError} from '../../structureBuilder'
import {resolveIntent} from '../resolveIntent'
import {PaneResolutionError} from '../PaneResolutionError'
import {
  getMockSource,
  getMockWorkspace,
} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {SchemaPluginOptions} from 'sanity'

const mockSchema: SchemaPluginOptions = {
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
}

describe('resolveIntent', () => {
  it('takes in an intent request and returns `RouterPanes` that match the request', async () => {
    const source = await getMockSource({config: {schema: mockSchema}})
    const workspace = await getMockWorkspace({config: {schema: mockSchema}})
    const S = createStructureBuilder({source, workspace})

    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.documentTypeListItem('author').title('Cool Authors'),
        S.divider(),
        S.documentTypeListItem('book').id('altBookId').title('Sick Books'),
        S.documentTypeListItem('movie').title('Rad Movies'),
      ]) as unknown as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'book123', type: 'book'},
      payload: undefined,
      rootPaneNode,
      structureContext: null as any,
    })

    expect(routerPanes).toEqual([
      [{id: 'altBookId'}],
      [{id: 'book123', params: {}, payload: undefined}],
    ])
  })

  it('resolves singletons', async () => {
    const source = await getMockSource({config: {schema: mockSchema}})
    const workspace = await getMockWorkspace({config: {schema: mockSchema}})
    const S = createStructureBuilder({source, workspace})

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
      ]) as unknown as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'settings', type: 'settings'},
      payload: undefined,
      rootPaneNode,
      structureContext: null as any,
    })

    expect(routerPanes).toEqual([[{id: 'settings', params: {}, payload: undefined}]])
  })

  it('resolves nested singletons', async () => {
    const source = await getMockSource({config: {schema: mockSchema}})
    const workspace = await getMockWorkspace({config: {schema: mockSchema}})
    const S = createStructureBuilder({source, workspace})

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
                      ]),
                  ),
              ]),
          ),
      ]) as unknown as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'settings', type: 'settings'},
      payload: undefined,
      rootPaneNode,
      structureContext: null as any,
    })

    expect(routerPanes).toEqual([
      [{id: 'deep'}],
      [{id: 'deeper'}],
      [{id: 'settings', params: {}, payload: undefined}],
    ])
  })

  it('returns the shallowest match', async () => {
    const source = await getMockSource({config: {schema: mockSchema}})
    const workspace = await getMockWorkspace({config: {schema: mockSchema}})
    const S = createStructureBuilder({source, workspace})

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
                      ]),
                  ),
              ]),
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
              ]),
          ),
      ]) as unknown as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'settings', type: 'settings'},
      payload: undefined,
      rootPaneNode,
      structureContext: null as any,
    })

    expect(routerPanes).toEqual([
      [{id: 'notSoDeep'}],
      [{id: 'settings', params: {}, payload: undefined}],
    ])
  })

  it('resolves to the fallback editor if no match is found', async () => {
    const source = await getMockSource({config: {schema: mockSchema}})
    const workspace = await getMockWorkspace({config: {schema: mockSchema}})
    const S = createStructureBuilder({source, workspace})

    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.documentTypeListItem('book').id('altBookId').title('Sick Books'),
        S.documentTypeListItem('movie').title('Rad Movies'),
      ]) as unknown as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'author123', type: 'author'},
      payload: undefined,
      rootPaneNode,
      structureContext: null as any,
    })

    expect(routerPanes).toEqual([
      [{id: '__edit__author123', params: {type: 'author'}, payload: undefined}],
    ])
  })

  it('matches document nodes that have the same ID as the target ID', async () => {
    const source = await getMockSource({config: {schema: mockSchema}})
    const workspace = await getMockWorkspace({config: {schema: mockSchema}})
    const S = createStructureBuilder({source, workspace})

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
      structureContext: null as any,
    })

    expect(routerPanes).toEqual([[{id: 'settings', params: {}, payload: undefined}]])
    expect(canHandleIntentSpy).toHaveBeenCalled()
  })

  it('resolves pane nodes that implement `canHandleIntent`', async () => {
    const source = await getMockSource({config: {schema: mockSchema}})
    const workspace = await getMockWorkspace({config: {schema: mockSchema}})
    const S = createStructureBuilder({source, workspace})

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
      ]) as unknown as UnresolvedPaneNode

    const routerPanes = await resolveIntent({
      intent: 'edit',
      params: {id: 'author123', type: 'author'},
      payload: undefined,
      rootPaneNode,
      structureContext: null as any,
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
    const source = await getMockSource({config: {schema: mockSchema}})
    const workspace = await getMockWorkspace({config: {schema: mockSchema}})
    const S = createStructureBuilder({source, workspace})

    const rootPaneNode = S.list().title('Content').items([
      // will give a missing ID error
      S.listItem(),
      // TODO:
    ]) as unknown as UnresolvedPaneNode

    let caught = false

    // const

    try {
      await resolveIntent({
        intent: 'edit',
        params: {id: 'author123', type: 'author'},
        payload: undefined,
        rootPaneNode,
        structureContext: null as any,
      })
    } catch (e) {
      caught = true
      expect(e.message).toEqual('`id` is required for list items')
      expect(e).toBeInstanceOf(PaneResolutionError)
      expect(e.cause).toBeInstanceOf(SerializeError)
    }

    expect(caught).toBe(true)
  })
})
