import {beforeEach, describe, expect, it} from 'vitest'

import {getIntentState, setActivePanes} from './getIntentState'
import {type PaneNode, type RouterPanes} from './types'

describe('getIntentState', () => {
  beforeEach(() => setActivePanes([]))

  // `StructureTool` reports the implicit root pane first, so active pane
  // indexes always sit one ahead of the router panes.
  const rootPane = {id: 'root', type: 'list'} as unknown as PaneNode

  it('preserves the `path` param when an open documentList pane handles an edit intent', () => {
    // An active documentList pane that can resolve the edit intent for type "post".
    setActivePanes([
      {
        type: 'documentList',
        schemaTypeName: 'post',
        options: {filter: '_type == $type'},
      } as unknown as PaneNode,
    ])

    const result = getIntentState(
      'edit',
      {
        id: 'doc1',
        type: 'post',
        path: 'body[_key=="abc"].title',
        // history/release params used to open a release version
        historyVersion: 'rTest',
        archivedRelease: 'true',
      },
      {panes: []},
      undefined,
    )

    expect('panes' in result).toBe(true)
    if ('panes' in result) {
      const lastGroup = result.panes[result.panes.length - 1] as Array<{
        params?: Record<string, string>
      }>
      // `path` (field deep-link) and the other document-pane params must survive the
      // fast-path, matching the cold-path resolver.
      expect(lastGroup[0].params?.path).toBe('body[_key=="abc"].title')
      expect(lastGroup[0].params?.historyVersion).toBe('rTest')
      expect(lastGroup[0].params?.archivedRelease).toBe('true')
    }
  })

  it('falls back to intent resolution when no open pane can handle it', () => {
    const result = getIntentState('edit', {id: 'doc1', type: 'post'}, {panes: []}, undefined)
    expect(result).toEqual({intent: 'edit', params: {id: 'doc1', type: 'post'}, payload: undefined})
  })

  describe('keepPanesOnCreate', () => {
    // Panes that refuse every intent, which is what a nested structure looks
    // like: `documentTypeList().child()` swaps the default handler for
    // `shallowIntentChecker`, which answers only for panes at index 0 or 1.
    const declining = {canHandleIntent: () => false}

    // The auto "+" affordance a `documentList` gets from its templates.
    const subpagesPane = (parentId: string) =>
      ({
        ...declining,
        id: `subpages-${parentId}`,
        type: 'documentList',
        schemaTypeName: 'page',
        options: {filter: '_type == "page" && parent._ref == $parentId'},
        initialValueTemplates: [
          {
            type: 'initialValueTemplateItem',
            id: 'page-with-parent',
            templateId: 'page-with-parent',
            parameters: {parentId},
          },
        ],
      }) as unknown as PaneNode

    // The explicit `.menuItems(S.menuItemsFromInitialValueTemplateItems(...))`
    // affordance, the only way a hand-built `S.list()` can offer a create
    // action.
    const pageNodePane = (parentId: string) =>
      ({
        ...declining,
        id: `page-node-${parentId}`,
        type: 'list',
        menuItems: [
          {
            title: 'New article',
            intent: {
              type: 'create',
              params: [{type: 'article', template: 'article-with-parent'}, {parentId}],
            },
          },
        ],
      }) as unknown as PaneNode

    const marketPane = {...declining, id: 'market', type: 'list'} as unknown as PaneNode
    const openDocumentPane = {...declining, id: 'page-2', type: 'document'} as unknown as PaneNode

    const openPanes: RouterPanes = [
      [{id: 'market'}],
      [{id: 'page-1'}],
      [{id: 'subpages'}],
      [{id: 'page-2'}],
    ]

    it('opens a template-driven create action as its own pane’s child', () => {
      setActivePanes([
        rootPane,
        marketPane,
        pageNodePane('page-1'),
        subpagesPane('page-1'),
        openDocumentPane,
      ])

      const result = getIntentState(
        'create',
        {id: 'newDoc', type: 'page', template: 'page-with-parent'},
        {panes: openPanes},
        {parentId: 'page-1'},
        true,
      )

      // The path up to and including the offering pane survives, the pane open
      // beyond it closes, and the editor becomes the offering pane's child. The
      // `__edit__` prefix is what keeps that pane's own `child` resolver from
      // claiming the new document.
      expect(result).toEqual({
        panes: [
          [{id: 'market'}],
          [{id: 'page-1'}],
          [{id: 'subpages'}],
          [
            {
              id: '__edit__newDoc',
              params: {type: 'page', template: 'page-with-parent'},
              payload: {parentId: 'page-1'},
            },
          ],
        ],
      })
    })

    it('recognises a create action offered through pane menu items', () => {
      setActivePanes([rootPane, marketPane, pageNodePane('page-1')])

      const result = getIntentState(
        'create',
        {type: 'article', template: 'article-with-parent'},
        {panes: openPanes.slice(0, 2)},
        {parentId: 'page-1'},
        true,
      )

      expect('panes' in result).toBe(true)
      if (!('panes' in result)) return
      expect(result.panes).toHaveLength(3)
      const [appended] = result.panes[2]
      expect(appended.id).toMatch(/^__edit__.+/)
      expect(appended.params).toEqual({type: 'article', template: 'article-with-parent'})
    })

    it('picks the pane whose template parameters match the intent, not the deepest', () => {
      // Every level of a page tree offers the same template and differs only in
      // its parent id, so the parameters are the only thing distinguishing the
      // "create" the editor actually clicked from a descendant's.
      setActivePanes([
        rootPane,
        marketPane,
        subpagesPane('page-1'),
        marketPane,
        subpagesPane('page-2'),
      ])

      const result = getIntentState(
        'create',
        {id: 'newDoc', type: 'page', template: 'page-with-parent'},
        {panes: openPanes},
        {parentId: 'page-1'},
        true,
      )

      expect('panes' in result).toBe(true)
      if (!('panes' in result)) return
      // Sliced to the ancestor pane that offers those parameters (active pane
      // index 2), not to the deeper one carrying `page-2`.
      expect(result.panes).toHaveLength(3)
      expect(result.panes[1]).toEqual([{id: 'page-1'}])
    })

    it('picks the deepest pane when several offer the identical action', () => {
      setActivePanes([rootPane, subpagesPane('page-1'), marketPane, subpagesPane('page-1')])

      const result = getIntentState(
        'create',
        {id: 'newDoc', type: 'page', template: 'page-with-parent'},
        {panes: openPanes},
        {parentId: 'page-1'},
        true,
      )

      expect('panes' in result).toBe(true)
      if (!('panes' in result)) return
      expect(result.panes).toHaveLength(4)
      expect(result.panes[2]).toEqual([{id: 'subpages'}])
    })

    it('ignores `initialValueTemplates` on a list pane, which renders no create button', () => {
      // `S.list()` serializes the field, but `ListPaneHeader` never forwards it
      // to `PaneHeaderActions`, so there is no button it could have come from.
      const listPaneWithTemplates = {
        ...declining,
        id: 'page-node',
        type: 'list',
        initialValueTemplates: [
          {
            type: 'initialValueTemplateItem',
            id: 'page-with-parent',
            templateId: 'page-with-parent',
            parameters: {parentId: 'page-1'},
          },
        ],
      } as unknown as PaneNode

      setActivePanes([rootPane, listPaneWithTemplates])

      const result = getIntentState(
        'create',
        {id: 'newDoc', type: 'page', template: 'page-with-parent'},
        {panes: openPanes},
        {parentId: 'page-1'},
        true,
      )

      expect(result).toEqual({
        intent: 'create',
        params: {id: 'newDoc', type: 'page', template: 'page-with-parent'},
        payload: {parentId: 'page-1'},
      })
    })

    it('hands over to intent resolution when no open pane offers the action', () => {
      // The navbar’s own "create new document" reaches this whenever the type
      // has no list pane open: nothing in the path advertises it, so the
      // structure-wide search still runs and jumps to where that type belongs.
      setActivePanes([rootPane, marketPane, pageNodePane('page-1'), subpagesPane('page-1')])

      const result = getIntentState(
        'create',
        {id: 'newDoc', type: 'settings', template: 'settings'},
        {panes: openPanes},
        undefined,
        true,
      )

      expect(result).toEqual({
        intent: 'create',
        params: {id: 'newDoc', type: 'settings', template: 'settings'},
        payload: undefined,
      })
    })

    it('hands over to intent resolution when the intent carries no document type', () => {
      // The fallback editor throws without a type, and `IntentResolver` is the
      // only place a missing one gets recovered, via the document store.
      setActivePanes([rootPane, subpagesPane('page-1')])

      const result = getIntentState(
        'create',
        {template: 'page-with-parent'},
        {panes: openPanes},
        {parentId: 'page-1'},
        true,
      )

      expect(result).toEqual({
        intent: 'create',
        params: {template: 'page-with-parent'},
        payload: {parentId: 'page-1'},
      })
    })

    it('leaves edit intents to the existing matcher', () => {
      // Opening an existing document already keeps the panes, so edit intents
      // that match nothing keep their current behaviour.
      setActivePanes([rootPane, subpagesPane('page-1')])

      const result = getIntentState(
        'edit',
        {id: 'page-9', type: 'page'},
        {panes: openPanes},
        undefined,
        true,
      )

      expect(result).toEqual({
        intent: 'edit',
        params: {id: 'page-9', type: 'page'},
        payload: undefined,
      })
    })

    it('leaves an intent the matcher already handles alone', () => {
      // A pane that answers the matcher keeps today's routing, plain document
      // id and all - the new branch is a fallback, not a replacement.
      setActivePanes([
        rootPane,
        {
          type: 'documentList',
          schemaTypeName: 'page',
          options: {filter: '_type == $type'},
          initialValueTemplates: [
            {type: 'initialValueTemplateItem', id: 'page', templateId: 'page'},
          ],
        } as unknown as PaneNode,
      ])

      const result = getIntentState(
        'create',
        {id: 'newDoc', type: 'page', template: 'page'},
        {panes: openPanes},
        undefined,
        true,
      )

      expect(result).toEqual({
        panes: [
          [{id: 'market'}],
          [{id: 'newDoc', params: {template: 'page', version: undefined}, payload: undefined}],
        ],
      })
    })

    it('is off by default', () => {
      setActivePanes([rootPane, marketPane, subpagesPane('page-1')])

      const result = getIntentState(
        'create',
        {id: 'newDoc', type: 'page', template: 'page-with-parent'},
        {panes: openPanes},
        {parentId: 'page-1'},
      )

      expect(result).toEqual({
        intent: 'create',
        params: {id: 'newDoc', type: 'page', template: 'page-with-parent'},
        payload: {parentId: 'page-1'},
      })
    })
  })
})
