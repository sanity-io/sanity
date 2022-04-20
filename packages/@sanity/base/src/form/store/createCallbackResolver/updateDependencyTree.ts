// this mirrors the document structure and tracks which callbacks are depending

import {TouchedPaths} from './wrapWithPathCollector'

export type CallbackDependencyNode = {
  callbackIds?: Set<string>
  children?: Record<string, CallbackDependencyNode>
}

interface UpdateDependencyTreeOptions {
  touchedPaths: TouchedPaths
  dependencies: CallbackDependencyNode
  callbackId: string
}

/**
 * Recursively writes the callback ID to every path given in `touchPaths` to
 * the given dependency tree. The nodes that have been written to are yielded.
 */
export function* updateDependencyTree({
  dependencies,
  touchedPaths,
  callbackId,
}: UpdateDependencyTreeOptions): Generator<CallbackDependencyNode> {
  // if is touched node is a leaf node
  if (!Object.keys(touchedPaths).length) {
    dependencies.callbackIds = dependencies.callbackIds || new Set()
    dependencies.callbackIds.add(callbackId)
    yield dependencies
    return
  }

  for (const key of Object.keys(touchedPaths)) {
    const nextDependencies = dependencies.children?.[key] || {}

    if (!dependencies.children?.[key]) {
      dependencies.children = dependencies.children || {}
      dependencies.children[key] = nextDependencies
    }

    yield* updateDependencyTree({
      dependencies: nextDependencies,
      touchedPaths: touchedPaths[key],
      callbackId,
    })
  }
}
