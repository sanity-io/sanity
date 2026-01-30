import {omit} from 'lodash-es'
import {firstValueFrom, type Observable} from 'rxjs'

import {type StructureContext} from '../structureBuilder'
import {
  type DocumentPaneNode,
  type PaneNode,
  type RouterPaneGroup,
  type RouterPanes,
  type RouterPaneSiblingContext,
  type UnresolvedPaneNode,
} from '../types'
import {assignId} from './assignId'
import {createPaneResolver, type PaneResolverMiddleware} from './createPaneResolver'
import {memoBind} from './memoBind'

/**
 * Creates split pane siblings for a document with defaultPanes configured.
 * Returns a RouterPaneGroup with multiple siblings, each showing a different view.
 */
function createSplitPaneGroup(
  documentPaneNode: DocumentPaneNode,
  documentId: string,
  otherParams: Record<string, string | undefined>,
  payload: unknown,
): RouterPaneGroup {
  const {defaultPanes} = documentPaneNode

  // If no defaultPanes or less than 2 views, return single pane
  if (!defaultPanes || defaultPanes.length < 2) {
    return [{id: documentId, params: otherParams, payload}]
  }

  // Create a sibling for each view in defaultPanes
  return defaultPanes.map((viewId) => ({
    id: documentId,
    params: {...otherParams, view: viewId},
    payload,
  }))
}

interface TraverseOptions {
  unresolvedPane: UnresolvedPaneNode | undefined
  intent: string
  params: {type: string; id: string; [key: string]: string | undefined}
  payload: unknown
  parent: PaneNode | null
  path: string[]
  currentId: string
  flatIndex: number
  levelIndex: number
  structureContext: StructureContext
}

export interface ResolveIntentOptions {
  rootPaneNode?: UnresolvedPaneNode
  intent: string
  params: {type: string; id: string; [key: string]: string | undefined}
  payload: unknown
  structureContext: StructureContext
}

/**
 * Resolves an intent request using breadth first search. If a match is not
 * found, the intent will resolve to the fallback editor.
 *
 * A match is found if:
 * 1. the `PaneNode` is of type `document` and the its ID matches the intent ID
 * 2. the `PaneNode` is of type `documentList` and the `schemaTypeName` matches
 * 3. the `PaneNode`'s `canHandleIntent` method returns true
 *
 * If a `PaneNode` of type `list` is found, it will be searched for a match.
 *
 * @see PaneNode
 */
export async function resolveIntent(options: ResolveIntentOptions): Promise<RouterPanes> {
  const resolvedPaneCache = new Map<string, Observable<PaneNode>>()

  // this is a simple version of the memoizer in `createResolvedPaneNodeStream`
  const memoize: PaneResolverMiddleware = (nextFn) => (unresolvedPane, context, flatIndex) => {
    const key = unresolvedPane && `${assignId(unresolvedPane)}-${context.path.join('__')}`
    const cachedResolvedPane = key && resolvedPaneCache.get(key)
    if (cachedResolvedPane) return cachedResolvedPane

    const result = nextFn(unresolvedPane, context, flatIndex)
    if (key) resolvedPaneCache.set(key, result)
    return result
  }

  const resolvePane = createPaneResolver(memoize)

  const fallbackEditorPanes: RouterPanes = [
    [
      {
        id: `__edit__${options.params.id}`,
        params: {...omit(options.params, ['id']), type: options.params.type},
        payload: options.payload,
      },
    ],
  ]

  async function traverse({
    currentId,
    flatIndex,
    intent,
    params,
    parent,
    path,
    payload,
    unresolvedPane,
    levelIndex,
    structureContext,
  }: TraverseOptions): Promise<
    Array<{panes: RouterPanes; depthIndex: number; levelIndex: number}>
  > {
    if (!unresolvedPane) return []

    const {id: targetId, type: schemaTypeName, ...otherParams} = params
    const context: RouterPaneSiblingContext = {
      id: currentId,
      splitIndex: 0,
      parent,
      path,
      index: flatIndex,
      params: {},
      payload: undefined,
      structureContext,
    }
    const resolvedPane = await firstValueFrom(resolvePane(unresolvedPane, context, flatIndex))

    // if the resolved pane is a document pane and the pane's ID matches then
    // resolve the intent to the current path
    if (resolvedPane.type === 'document' && resolvedPane.id === targetId) {
      // Create split pane group if defaultPanes is configured
      const documentPaneGroup = createSplitPaneGroup(resolvedPane, targetId, otherParams, payload)

      return [
        {
          panes: [...path.slice(0, path.length - 1).map((i) => [{id: i}]), documentPaneGroup],
          depthIndex: path.length,
          levelIndex,
        },
      ]
    }

    // NOTE: if you update this logic, please also update the similar handler in
    // `getIntentState.ts`
    if (
      // if the resolve pane's `canHandleIntent` returns true, then resolve
      resolvedPane.canHandleIntent?.(intent, params, {
        pane: resolvedPane,
        index: flatIndex,
      }) ||
      // if the pane's `canHandleIntent` did not return true, then match against
      // this default case. we will resolve the intent if:
      (resolvedPane.type === 'documentList' &&
        // 1. the schema type matches (this required for the document to render)
        resolvedPane.schemaTypeName === schemaTypeName &&
        // 2. the filter is the default filter.
        //
        // NOTE: this case is to prevent false positive matches where the user
        // has configured a more specific filter for a particular type. In that
        // case, the user can implement their own `canHandleIntent` function
        resolvedPane.options.filter === '_type == $type')
    ) {
      // Create split pane group if defaultPanes is configured
      let documentPaneGroup: RouterPaneGroup = [{id: params.id, params: otherParams, payload}]

      // Only check for defaultPanes if structureContext is available
      if (structureContext) {
        // Resolve the document node to check for defaultPanes config
        const documentNode = structureContext
          .resolveDocumentNode({documentId: params.id, schemaType: schemaTypeName})
          .serialize({path: [...path, params.id]})

        documentPaneGroup = createSplitPaneGroup(
          documentNode as DocumentPaneNode,
          params.id,
          otherParams,
          payload,
        )
      }

      return [
        {
          panes: [
            // map the current path to router panes
            ...path.map((id) => [{id}]),
            // then augment with the document pane(s)
            documentPaneGroup,
          ],
          depthIndex: path.length,
          levelIndex,
        },
      ]
    }

    if (resolvedPane.type === 'list' && resolvedPane.child && resolvedPane.items) {
      return (
        await Promise.all(
          resolvedPane.items.map((item, nextLevelIndex) => {
            if (item.type === 'divider') return Promise.resolve([])

            return traverse({
              currentId: item._id || item.id,
              flatIndex: flatIndex + 1,
              intent,
              params,
              parent: resolvedPane,
              path: [...path, item.id],
              payload,
              unresolvedPane:
                typeof resolvedPane.child === 'function'
                  ? memoBind(resolvedPane, 'child')
                  : resolvedPane.child,
              levelIndex: nextLevelIndex,
              structureContext,
            })
          }),
        )
      ).flat()
    }

    return []
  }

  const matchingPanes = await traverse({
    currentId: 'root',
    flatIndex: 0,
    levelIndex: 0,
    intent: options.intent,
    params: options.params,
    parent: null,
    path: [],
    payload: options.payload,
    unresolvedPane: options.rootPaneNode,
    structureContext: options.structureContext,
  })

  const closestPaneToRoot = matchingPanes.sort((a, b) => {
    // break ties with the level index
    if (a.depthIndex === b.depthIndex) return a.levelIndex - b.levelIndex
    return a.depthIndex - b.depthIndex
  })[0]

  if (closestPaneToRoot) {
    return closestPaneToRoot.panes
  }

  return fallbackEditorPanes
}
