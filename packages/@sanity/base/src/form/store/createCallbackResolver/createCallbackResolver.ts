/* eslint-disable callback-return */
import {ConditionalPropertyCallbackContext, SanityDocumentLike, SchemaType} from '@sanity/types'
import {wrapWithPathCollector} from './wrapWithPathCollector'
import {getCallbackIdsToUpdate} from './getCallbackIdsToUpdate'
import {CallbackDependencyNode, updateDependencyTree} from './updateDependencyTree'
import {getCallbackFromSchema} from './getCallbackFromSchema'

type CurrentUser = ConditionalPropertyCallbackContext['currentUser']

const getPathFromCallbackId = (callbackId: string) => callbackId.split('/')

function deepSet(
  target: ResolvedCallbackNode | null,
  [first, ...rest]: string[],
  result: boolean
): ResolvedCallbackNode {
  if (!first) {
    return {
      value: result,
      ...(target?.children && {children: target.children}),
    }
  }

  const nextChildren = {...target?.children}
  const subTarget = target?.children?.[first] || null
  nextChildren[first] = deepSet(subTarget, rest, result)

  return {
    ...(typeof target?.value === 'boolean' && {value: target.value}),
    children: nextChildren,
  }
}

export interface ResolvedCallbackNode {
  value?: boolean
  children?: Record<string, ResolvedCallbackNode>
}

export interface CallbackResolver {
  (document: Partial<SanityDocumentLike>, currentUser: CurrentUser): ResolvedCallbackNode
}

/**
 * Returns a callback resolver function that computes a tree that contains the
 * result of each conditional property as defined by the user in their schema.
 *
 * The computation of this tree is optimized by inspecting the specific paths
 * each callback touches via the use of proxies. When a new document value is
 * provided, it is compared with the last document value given to the function
 * (Note: subsequent document values are assumed to be modified immutably in
 * order to utilize referentially equality for skipping large diffs of unchanged
 * nodes).
 *
 * If a difference within a document is found, all the callbacks that touch that
 * path will be re-ran and the paths they touch within a document will be
 * re-inspected. The result of each callback will then be written to a new
 * result tree utilizing the previous result tree as input.
 *
 * Each new tree returned preserves any inner nodes that don't change so
 * referentially equality can be used to skip unchanged nodes.
 */
export function createCallbackResolver(
  documentSchemaType: SchemaType,
  conditionalPropertyKey: 'readOnly' | 'hidden'
): CallbackResolver {
  // state held within the closure
  let previousDocument: SanityDocumentLike | null = null
  let previousUser: CurrentUser | null = null
  let previousResult: ResolvedCallbackNode

  /**
   * defines the root dependency node that contains the full dependency tree.
   * this tree is frequently mutated as the dependencies (i.e. the paths the
   * callbacks touch) to callbacks changes
   */
  const rootDependencies: CallbackDependencyNode = {
    children: {document: {}, currentUser: {}},
  }

  /**
   * holds the list of dependency node references per callback. this is used to
   * quickly find all the dependencies nodes that relate to the given callback.
   *
   * when a callback is marked as needing to be updated, it quickly deletes all
   * references to itself via this structure
   */
  const dependenciesByCallbackId: Record<string, Set<CallbackDependencyNode>> = {}

  /**
   * a wrapper schema type that represents the virtual top-level
   * `currentUser`/`document` pair. Note that a schema definition for the
   * `currentUser` is not required since no callback implementations can exist
   * inside this virtual schema object
   */
  const schemaType: SchemaType = {
    jsonType: 'object',
    fields: [
      {name: 'document', type: documentSchemaType},
      // Note: a currentUser schema field isn't required
    ],
    name: 'documentUser',
  }

  // created up here to return a stable value
  const emptyResult: ResolvedCallbackNode = {}

  function callbackResolver(
    nextDocument: SanityDocumentLike,
    nextUser: CurrentUser
  ): ResolvedCallbackNode {
    // short circuit
    if (nextDocument === previousDocument && previousUser === nextUser) {
      return previousResult
    }

    // `getCallbackIdsToUpdate` begins the diff of the previous and next values.
    // as it traverse, it also drills into the dependency tree yielding any
    // callback IDs that are flagged to have their callbacks re-ran.
    const callbackIdsToUpdate = new Set(
      getCallbackIdsToUpdate({
        prev: {document: previousDocument, currentUser: previousUser},
        curr: {document: nextDocument, currentUser: nextUser},
        dependencies: rootDependencies,
        path: [],
        schemaType,
        conditionalPropertyKey,
      })
    )

    // the `result` will be modified immutable using the previous result as the
    // starting point
    let result = previousResult

    for (const callbackId of callbackIdsToUpdate) {
      // step 1: get the callback
      const callback = getCallbackFromSchema({
        schemaType,
        path: getPathFromCallbackId(callbackId),
        conditionalPropertyKey,
      })

      // step 2: wrap the callback in the proxy-tracking function
      const wrappedCallback = wrapWithPathCollector({
        callback,
        path: getPathFromCallbackId(callbackId),
      })

      // step 3: evaluate the function and get the result and touched paths
      const [callbackResult, touchedPaths] = wrappedCallback({
        document: nextDocument,
        currentUser: nextUser,
      })

      if (!dependenciesByCallbackId[callbackId]) {
        dependenciesByCallbackId[callbackId] = new Set()
      }

      // get the nodes in the dependency tree where this callback is referred to
      // via the `dependenciesByCallbackId` index
      const dependencyNodes = dependenciesByCallbackId[callbackId]

      // step 4: erase all references to the current callback ID from the whole
      // dependency tree by iterating through all the `dependencyNodes`
      for (const dependencyNode of dependencyNodes) {
        dependencyNode.callbackIds?.delete(callbackId)
        if (!dependencyNode.callbackIds?.size) {
          delete dependencyNode.callbackIds
        }
      }

      // step 5: using the new `touchedPaths` result from the proxy, write the
      // current callback ID to the new locations within the root dependency
      // tree
      const updatedDependencyNodes = Array.from(
        // this function yields the nodes that it ends up writing to
        updateDependencyTree({
          touchedPaths,
          dependencies: rootDependencies,
          callbackId,
        })
      )

      // step 6: for the resulting updated dependency nodes, either re-add the
      // nodes to the `dependencyNodes` index if any or delete callback entry if
      // none
      if (updatedDependencyNodes.length) {
        for (const dependency of updatedDependencyNodes) {
          dependencyNodes.add(dependency)
        }
      } else {
        delete dependenciesByCallbackId[callbackId]
      }

      // step 7: finally take the new result and deep-set the new value from the
      // callback's path
      result = deepSet(result, getPathFromCallbackId(callbackId), callbackResult)
    }

    previousDocument = nextDocument
    previousUser = nextUser
    previousResult = result

    // return just the document portion of the result
    return result.children?.document || emptyResult
  }

  return callbackResolver
}
