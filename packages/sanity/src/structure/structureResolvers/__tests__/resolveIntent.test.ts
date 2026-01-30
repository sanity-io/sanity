/* this has to be imported after createStructureBuilder due to what looks like a circular import issue */
import {describe, expect, it, vi} from 'vitest'
// oxfmt-ignore
import {createStructureBuilder, SerializeError} from '../../structureBuilder'
// oxfmt-ignore
import {type SchemaPluginOptions} from 'sanity'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {type PaneNode, type UnresolvedPaneNode} from '../../types'
import {PaneResolutionError} from '../PaneResolutionError'
import {resolveIntent} from '../resolveIntent'

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
    const S = createStructureBuilder({source})

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
    const S = createStructureBuilder({source})

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
    const S = createStructureBuilder({source})

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
    const S = createStructureBuilder({source})

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
    const S = createStructureBuilder({source})

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
    const S = createStructureBuilder({source})

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
    const canHandleIntentSpy = vi.spyOn(rootPaneNode, 'canHandleIntent').mockReturnValue(false)

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
    const S = createStructureBuilder({source})

    const list = S.list()
      .canHandleIntent(() => true)
      .title('My List')
      .serialize()

    const canHandleIntentSpy = vi.spyOn(list, 'canHandleIntent')

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

  it('resolves custom components that implement `canHandleIntent`', async () => {
    const source = await getMockSource({config: {schema: mockSchema}})
    const S = createStructureBuilder({source})

    const customComponent = S.component(() => null)
      .canHandleIntent(() => true)
      .title('My Component')
      .serialize()

    const canHandleIntentSpy = vi.spyOn(customComponent, 'canHandleIntent')

    const rootPaneNode = S.list()
      .title('Content')
      .items([
        S.documentTypeListItem('book').title('Sick Books'),
        S.documentTypeListItem('movie').title('Rad Movies'),
        S.listItem().title('Some Item').child(customComponent),
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
        {index: 1, pane: {id: 'myComponent', title: 'My Component', type: 'component'}},
      ],
    ])
  })

  it('bubbles (re-throws) structure errors wrapped in a PaneResolutionError', async () => {
    const source = await getMockSource({config: {schema: mockSchema}})
    const S = createStructureBuilder({source})

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

  describe('defaultPanes', () => {
    it('creates split panes when defaultPanes is configured on a document node', async () => {
      const source = await getMockSource({config: {schema: mockSchema}})
      const S = createStructureBuilder({
        source,
        defaultDocumentNode: (builder, {schemaType}) => {
          if (schemaType === 'author') {
            return builder
              .document()
              .views([
                builder.view.form().id('editor'),
                builder.view.form().id('preview').title('Preview'),
              ])
              .defaultPanes(['editor', 'preview'])
          }
          return builder.document()
        },
        perspectiveStack: ['drafts'],
      })

      const rootPaneNode = S.list()
        .title('Content')
        .items([
          S.documentTypeListItem('author').title('Authors'),
          S.documentTypeListItem('book').title('Books'),
        ]) as unknown as UnresolvedPaneNode

      const routerPanes = await resolveIntent({
        intent: 'edit',
        params: {id: 'author123', type: 'author'},
        payload: undefined,
        rootPaneNode,
        structureContext: S.context,
      })

      // Should have split panes with both views
      expect(routerPanes).toEqual([
        [{id: 'author'}],
        [
          {id: 'author123', params: {view: 'editor'}, payload: undefined},
          {id: 'author123', params: {view: 'preview'}, payload: undefined},
        ],
      ])
    })

    it('does not create split panes when defaultPanes has only one view', async () => {
      const source = await getMockSource({config: {schema: mockSchema}})
      const S = createStructureBuilder({
        source,
        defaultDocumentNode: (builder, {schemaType}) => {
          if (schemaType === 'author') {
            return builder
              .document()
              .views([
                builder.view.form().id('editor'),
                builder.view.form().id('preview').title('Preview'),
              ])
              .defaultPanes(['editor']) // Only one view - should not split
          }
          return builder.document()
        },
        perspectiveStack: ['drafts'],
      })

      const rootPaneNode = S.list()
        .title('Content')
        .items([S.documentTypeListItem('author').title('Authors')]) as unknown as UnresolvedPaneNode

      const routerPanes = await resolveIntent({
        intent: 'edit',
        params: {id: 'author123', type: 'author'},
        payload: undefined,
        rootPaneNode,
        structureContext: S.context,
      })

      // Should have single pane, no split
      expect(routerPanes).toEqual([
        [{id: 'author'}],
        [{id: 'author123', params: {}, payload: undefined}],
      ])
    })

    it('filters invalid view IDs from defaultPanes', async () => {
      const source = await getMockSource({config: {schema: mockSchema}})
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn())

      const S = createStructureBuilder({
        source,
        defaultDocumentNode: (builder, {schemaType}) => {
          if (schemaType === 'author') {
            return builder
              .document()
              .views([
                builder.view.form().id('editor'),
                builder.view.form().id('preview').title('Preview'),
              ])
              .defaultPanes(['editor', 'invalid-view', 'preview'])
          }
          return builder.document()
        },
        perspectiveStack: ['drafts'],
      })

      const rootPaneNode = S.list()
        .title('Content')
        .items([S.documentTypeListItem('author').title('Authors')]) as unknown as UnresolvedPaneNode

      const routerPanes = await resolveIntent({
        intent: 'edit',
        params: {id: 'author123', type: 'author'},
        payload: undefined,
        rootPaneNode,
        structureContext: S.context,
      })

      // Should create split panes with only valid view IDs
      expect(routerPanes).toEqual([
        [{id: 'author'}],
        [
          {id: 'author123', params: {view: 'editor'}, payload: undefined},
          {id: 'author123', params: {view: 'preview'}, payload: undefined},
        ],
      ])

      // Should have warned about invalid view ID
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('invalid-view'))

      consoleSpy.mockRestore()
    })

    it('does not create split panes for documents without defaultPanes', async () => {
      const source = await getMockSource({config: {schema: mockSchema}})
      const S = createStructureBuilder({
        source,
        defaultDocumentNode: (builder) => {
          return builder
            .document()
            .views([
              builder.view.form().id('editor'),
              builder.view.form().id('preview').title('Preview'),
            ])
          // No defaultPanes configured
        },
        perspectiveStack: ['drafts'],
      })

      const rootPaneNode = S.list()
        .title('Content')
        .items([S.documentTypeListItem('author').title('Authors')]) as unknown as UnresolvedPaneNode

      const routerPanes = await resolveIntent({
        intent: 'edit',
        params: {id: 'author123', type: 'author'},
        payload: undefined,
        rootPaneNode,
        structureContext: S.context,
      })

      // Should have single pane, no split
      expect(routerPanes).toEqual([
        [{id: 'author'}],
        [{id: 'author123', params: {}, payload: undefined}],
      ])
    })

    it('does not create split panes when defaultPanes is empty array', async () => {
      const source = await getMockSource({config: {schema: mockSchema}})
      const S = createStructureBuilder({
        source,
        defaultDocumentNode: (builder, {schemaType}) => {
          if (schemaType === 'author') {
            return builder
              .document()
              .views([
                builder.view.form().id('editor'),
                builder.view.form().id('preview').title('Preview'),
              ])
              .defaultPanes([]) // Empty array - should not split
          }
          return builder.document()
        },
        perspectiveStack: ['drafts'],
      })

      const rootPaneNode = S.list()
        .title('Content')
        .items([S.documentTypeListItem('author').title('Authors')]) as unknown as UnresolvedPaneNode

      const routerPanes = await resolveIntent({
        intent: 'edit',
        params: {id: 'author123', type: 'author'},
        payload: undefined,
        rootPaneNode,
        structureContext: S.context,
      })

      // Should have single pane, no split
      expect(routerPanes).toEqual([
        [{id: 'author'}],
        [{id: 'author123', params: {}, payload: undefined}],
      ])
    })

    it('creates multiple split panes when defaultPanes has more than 2 views', async () => {
      const source = await getMockSource({config: {schema: mockSchema}})
      const S = createStructureBuilder({
        source,
        defaultDocumentNode: (builder, {schemaType}) => {
          if (schemaType === 'author') {
            return builder
              .document()
              .views([
                builder.view.form().id('editor'),
                builder.view.form().id('preview').title('Preview'),
                builder.view.form().id('json').title('JSON'),
              ])
              .defaultPanes(['editor', 'preview', 'json'])
          }
          return builder.document()
        },
        perspectiveStack: ['drafts'],
      })

      const rootPaneNode = S.list()
        .title('Content')
        .items([S.documentTypeListItem('author').title('Authors')]) as unknown as UnresolvedPaneNode

      const routerPanes = await resolveIntent({
        intent: 'edit',
        params: {id: 'author123', type: 'author'},
        payload: undefined,
        rootPaneNode,
        structureContext: S.context,
      })

      // Should have 3 split panes
      expect(routerPanes).toEqual([
        [{id: 'author'}],
        [
          {id: 'author123', params: {view: 'editor'}, payload: undefined},
          {id: 'author123', params: {view: 'preview'}, payload: undefined},
          {id: 'author123', params: {view: 'json'}, payload: undefined},
        ],
      ])
    })

    it('preserves other params in split panes', async () => {
      const source = await getMockSource({config: {schema: mockSchema}})
      const S = createStructureBuilder({
        source,
        defaultDocumentNode: (builder, {schemaType}) => {
          if (schemaType === 'author') {
            return builder
              .document()
              .views([
                builder.view.form().id('editor'),
                builder.view.form().id('preview').title('Preview'),
              ])
              .defaultPanes(['editor', 'preview'])
          }
          return builder.document()
        },
        perspectiveStack: ['drafts'],
      })

      const rootPaneNode = S.list()
        .title('Content')
        .items([S.documentTypeListItem('author').title('Authors')]) as unknown as UnresolvedPaneNode

      const routerPanes = await resolveIntent({
        intent: 'edit',
        params: {id: 'author123', type: 'author', inspect: 'changes'},
        payload: undefined,
        rootPaneNode,
        structureContext: S.context,
      })

      // Should preserve 'inspect' param in all split panes
      expect(routerPanes).toEqual([
        [{id: 'author'}],
        [
          {id: 'author123', params: {view: 'editor', inspect: 'changes'}, payload: undefined},
          {id: 'author123', params: {view: 'preview', inspect: 'changes'}, payload: undefined},
        ],
      ])
    })

    it('preserves payload in split panes', async () => {
      const source = await getMockSource({config: {schema: mockSchema}})
      const S = createStructureBuilder({
        source,
        defaultDocumentNode: (builder, {schemaType}) => {
          if (schemaType === 'author') {
            return builder
              .document()
              .views([
                builder.view.form().id('editor'),
                builder.view.form().id('preview').title('Preview'),
              ])
              .defaultPanes(['editor', 'preview'])
          }
          return builder.document()
        },
        perspectiveStack: ['drafts'],
      })

      const rootPaneNode = S.list()
        .title('Content')
        .items([S.documentTypeListItem('author').title('Authors')]) as unknown as UnresolvedPaneNode

      const testPayload = {initialValue: {name: 'Test Author'}}
      const routerPanes = await resolveIntent({
        intent: 'edit',
        params: {id: 'author123', type: 'author'},
        payload: testPayload,
        rootPaneNode,
        structureContext: S.context,
      })

      // Should preserve payload in all split panes
      expect(routerPanes).toEqual([
        [{id: 'author'}],
        [
          {id: 'author123', params: {view: 'editor'}, payload: testPayload},
          {id: 'author123', params: {view: 'preview'}, payload: testPayload},
        ],
      ])
    })
  })
})
