import {BehaviorSubject, filter, firstValueFrom, NEVER, of, ReplaySubject} from 'rxjs'
import {type SchemaPluginOptions} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {type ItemChild} from '../../structureBuilder/ChildResolver'
import {createStructureBuilder} from '../../structureBuilder/createStructureBuilder'
import {type RouterPanes, type UnresolvedPaneNode} from '../../types'
import {createResolvedPaneNodeStream, type ResolvedPaneMeta} from '../createResolvedPaneNodeStream'

const mockSchema: SchemaPluginOptions = {
  name: 'mockSchema',
  types: [
    {
      name: 'page',
      title: 'Page',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {name: 'parent', type: 'reference', to: [{type: 'page'}]},
      ],
    },
  ],
}

/**
 * A page tree: a nested `documentTypeList` whose own `.child()` opens another
 * list of the page's subpages, rather than the document editor. This is the
 * shape that makes the `__edit__` prefix load-bearing.
 */
async function getPageTreeStructure() {
  const source = await getMockSource({config: {schema: mockSchema}})
  // @ts-expect-error -- matches the cast in `resolveIntent.test.ts`
  const S = createStructureBuilder({source})

  const rootPaneNode = S.list()
    .title('Content')
    .items([
      S.listItem()
        .id('pages')
        .title('Pages')
        .child(
          S.documentTypeList('page')
            .id('subpages')
            .apiVersion('2024-01-01')
            .filter('_type == "page" && parent._ref == $parentId')
            .params({parentId: 'root'})
            .child(() => S.list().id('page-node').title('Page node').items([])),
        ),
    ]) as unknown as UnresolvedPaneNode

  return {rootPaneNode, structureContext: S.context}
}

async function resolvePanes(routerPanes: RouterPanes) {
  const {rootPaneNode, structureContext} = await getPageTreeStructure()

  return firstValueFrom(
    createResolvedPaneNodeStream({
      routerPanesStream: of(routerPanes),
      rootPaneNode,
      structureContext,
    }).pipe(
      // the stream emits progressively, with not-yet-resolved panes reported as
      // loading placeholders - wait for the settled emission
      filter((metas) => metas.every((meta) => meta.type === 'resolvedMeta')),
    ),
  )
}

describe('createResolvedPaneNodeStream', () => {
  it('resolves an `__edit__` pane to the document editor, keeping the panes before it', async () => {
    // This is the pane path `getIntentState` produces with
    // `keepPanesOnCreate`: the navigation panes untouched, with the implicit
    // fallback editor appended as the offering pane's child.
    const resolvedPanes = await resolvePanes([
      [{id: 'pages'}],
      [{id: '__edit__page123', params: {type: 'page'}}],
    ])

    // The implicit root pane, the subpages list, then the document editor.
    expect(resolvedPanes).toHaveLength(3)
    expect(resolvedPanes[1].paneNode?.type).toBe('documentList')

    const editorPane = resolvedPanes[2].paneNode
    expect(editorPane?.type).toBe('document')
    expect(editorPane?.type === 'document' && editorPane.options).toEqual({
      id: 'page123',
      type: 'page',
    })
  })

  it('resolves an `__edit__` pane appended to a deeper path', async () => {
    // Three panes deep, and the pane it is appended to is a plain `S.list()`
    // with no `child` of its own - the prefix is what lets the editor open
    // there at all.
    const resolvedPanes = await resolvePanes([
      [{id: 'pages'}],
      [{id: 'page-1'}],
      [{id: '__edit__page456', params: {type: 'page'}}],
    ])

    expect(resolvedPanes).toHaveLength(4)
    expect(resolvedPanes.map((meta) => meta.paneNode?.id)).toEqual([
      'content',
      'subpages',
      'page-node',
      // the id the fallback editor gives itself
      'editor',
    ])

    const editorPane = resolvedPanes[3].paneNode
    expect(editorPane?.type).toBe('document')
    expect(editorPane?.type === 'document' && editorPane.options).toEqual({
      id: 'page456',
      type: 'page',
    })
  })

  it('resolves a plain document id through the parent pane’s own `child`', async () => {
    // The contrast that makes the `__edit__` prefix necessary: appending the
    // plain document id runs the `documentTypeList`'s `.child()`, which here
    // opens the subpage list rather than the document editor.
    const resolvedPanes = await resolvePanes([[{id: 'pages'}], [{id: 'page123'}]])

    expect(resolvedPanes).toHaveLength(3)
    expect(resolvedPanes[2].paneNode?.id).toBe('page-node')
    expect(resolvedPanes[2].paneNode?.type).toBe('list')
  })
})

/**
 * A structure where the root and the `pages` list only resolve when the test
 * releases them, like a structure whose lists wait for a fetch.
 */
async function getSlowStructure() {
  const source = await getMockSource({config: {schema: mockSchema}})
  // @ts-expect-error -- matches the cast in `resolveIntent.test.ts`
  const S = createStructureBuilder({source})

  const pagesList = new ReplaySubject<ItemChild>(1)
  const rootList = new ReplaySubject<UnresolvedPaneNode>(1)
  const root = S.list()
    .id('content')
    .title('Content')
    .items([
      S.listItem()
        .id('pages')
        .title('Pages')
        .child(() => pagesList.asObservable()),
    ]) as unknown as UnresolvedPaneNode

  return {
    rootPaneNode: rootList.asObservable(),
    structureContext: S.context,
    releaseRoot: () => rootList.next(root),
    releasePages: () =>
      pagesList.next(S.documentTypeList('page').id('pages-list').apiVersion('2024-01-01')),
  }
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function summarize(metas: ResolvedPaneMeta[]) {
  return metas.map((meta) =>
    meta.type === 'loading'
      ? `loading:${meta.routerPaneSibling.id}`
      : `${meta.paneNode.type}:${meta.routerPaneSibling.id}${meta.handoffKey ? `#${meta.handoffKey}` : ''}`,
  )
}

describe('createResolvedPaneNodeStream with a resolving pane', () => {
  it('waits for the root before an `__edit__` pane, as before', async () => {
    const emissions: ResolvedPaneMeta[][] = []
    const {structureContext} = await getSlowStructure()

    const subscription = createResolvedPaneNodeStream({
      routerPanesStream: of([[{id: '__edit__page123', params: {type: 'page'}}]]),
      rootPaneNode: NEVER,
      structureContext,
    }).subscribe((metas) => emissions.push(metas))
    await settle()
    subscription.unsubscribe()

    expect(emissions).toEqual([])
  })

  it('keeps the document in every emission while the resolved path loads its ancestors', async () => {
    const {rootPaneNode, structureContext, releaseRoot, releasePages} = await getSlowStructure()
    const routerPanes = new BehaviorSubject<RouterPanes>([
      [{id: '__resolve__page123', params: {type: 'page'}}],
    ])
    const emissions: ResolvedPaneMeta[][] = []

    const subscription = createResolvedPaneNodeStream({
      routerPanesStream: routerPanes,
      rootPaneNode,
      structureContext,
    }).subscribe((metas) => emissions.push(metas))
    await settle()

    // the document renders before the root resolves
    expect(summarize(emissions.at(-1)!)).toEqual([
      'loading:root',
      'document:__resolve__page123#handoff-page123-0',
    ])
    const documentPane = emissions.at(-1)![1]
    expect(
      documentPane.type === 'resolvedMeta' &&
        documentPane.paneNode.type === 'document' &&
        documentPane.paneNode.options,
    ).toEqual({
      id: 'page123',
      type: 'page',
    })

    releaseRoot()
    await settle()

    expect(summarize(emissions.at(-1)!)).toEqual([
      'list:root',
      'document:__resolve__page123#handoff-page123-0',
    ])
    const optimisticDocument = emissions.at(-1)![1].paneNode
    const swapIndex = emissions.length

    routerPanes.next([[{id: 'pages'}], [{id: 'page123'}]])
    await settle()

    expect(emissions.slice(swapIndex).map(summarize)).toEqual([
      ['list:root', 'loading:pages', 'document:page123#handoff-page123-0'],
    ])
    // the open document pane node is reused until the real one resolves
    expect(emissions.at(-1)![2].paneNode).toBe(optimisticDocument)

    releasePages()
    await settle()

    expect(summarize(emissions.at(-1)!)).toEqual([
      'list:root',
      'documentList:pages',
      'document:page123#handoff-page123-0',
    ])
    expect(emissions.at(-1)![2].paneNode).not.toBe(optimisticDocument)
    expect(emissions.at(-1)![2].path).toEqual(['root', 'pages', 'page123'])
    for (const emission of emissions.slice(swapIndex)) {
      expect(emission.some((meta) => meta.handoffKey === 'handoff-page123-0')).toBe(true)
    }

    subscription.unsubscribe()
  })

  it('keeps the document in its own group while a list that shares its id loads', async () => {
    const {rootPaneNode, structureContext, releaseRoot, releasePages} = await getSlowStructure()
    releaseRoot()
    const routerPanes = new BehaviorSubject<RouterPanes>([
      [{id: '__resolve__pages', params: {type: 'page'}}],
    ])
    const emissions: ResolvedPaneMeta[][] = []

    const subscription = createResolvedPaneNodeStream({
      routerPanesStream: routerPanes,
      rootPaneNode,
      structureContext,
    }).subscribe((metas) => emissions.push(metas))
    await settle()
    const swapIndex = emissions.length

    routerPanes.next([[{id: 'pages'}], [{id: 'pages'}]])
    await settle()
    releasePages()
    await settle()

    const afterSwap = emissions.slice(swapIndex).map(summarize)
    expect(afterSwap[0]).toEqual(['list:root', 'loading:pages', 'document:pages#handoff-pages-0'])
    for (const emission of afterSwap) {
      expect(emission[2]).toBe('document:pages#handoff-pages-0')
    }
    expect(afterSwap.at(-1)).toEqual([
      'list:root',
      'documentList:pages',
      'document:pages#handoff-pages-0',
    ])

    subscription.unsubscribe()
  })

  it('stops tagging the document once the user navigates away from it', async () => {
    const {rootPaneNode, structureContext, releaseRoot, releasePages} = await getSlowStructure()
    releaseRoot()
    releasePages()
    const routerPanes = new BehaviorSubject<RouterPanes>([
      [{id: '__resolve__page123', params: {type: 'page'}}],
    ])
    const emissions: ResolvedPaneMeta[][] = []

    const subscription = createResolvedPaneNodeStream({
      routerPanesStream: routerPanes,
      rootPaneNode,
      structureContext,
    }).subscribe((metas) => emissions.push(metas))
    await settle()
    routerPanes.next([[{id: 'pages'}], [{id: 'page123'}]])
    await settle()
    expect(summarize(emissions.at(-1)!)).toEqual([
      'list:root',
      'documentList:pages',
      'document:page123#handoff-page123-0',
    ])

    routerPanes.next([[{id: 'pages'}]])
    await settle()
    expect(summarize(emissions.at(-1)!)).toEqual(['list:root', 'documentList:pages'])

    routerPanes.next([[{id: 'pages'}], [{id: 'page123'}]])
    await settle()
    expect(summarize(emissions.at(-1)!)).toEqual([
      'list:root',
      'documentList:pages',
      'document:page123',
    ])

    subscription.unsubscribe()
  })

  it('tags every split sibling of the resolving document', async () => {
    const {rootPaneNode, structureContext, releaseRoot} = await getSlowStructure()
    releaseRoot()
    const emissions: ResolvedPaneMeta[][] = []

    const subscription = createResolvedPaneNodeStream({
      routerPanesStream: of([
        [
          {id: '__resolve__page123', params: {type: 'page', view: 'editor'}},
          {id: '__resolve__page123', params: {type: 'page', view: 'preview'}},
        ],
      ]),
      rootPaneNode,
      structureContext,
    }).subscribe((metas) => emissions.push(metas))
    await settle()
    subscription.unsubscribe()

    expect(summarize(emissions.at(-1)!)).toEqual([
      'list:root',
      'document:__resolve__page123#handoff-page123-0',
      'document:__resolve__page123#handoff-page123-1',
    ])
  })
})
