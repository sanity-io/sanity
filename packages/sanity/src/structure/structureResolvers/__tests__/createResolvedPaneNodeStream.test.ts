import {filter, firstValueFrom, of} from 'rxjs'
import {type SchemaPluginOptions} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../../structureBuilder/createStructureBuilder'
import {type RouterPanes, type UnresolvedPaneNode} from '../../types'
import {createResolvedPaneNodeStream} from '../createResolvedPaneNodeStream'

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
