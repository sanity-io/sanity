import {Path, PathSegment} from '@sanity/types'
import {ChangeNode, FieldChangeNode} from '../../types'
import {getItemKey} from '../../paths'

const isAddedAction = (change: ChangeNode): boolean => {
  return change.type === 'field' && change.diff.action === 'added'
}

const flattenChangeNode = (changeNode: ChangeNode): FieldChangeNode[] => {
  if (changeNode.type !== 'group') {
    return [changeNode]
  }

  const newSubChanges: FieldChangeNode[] = []

  changeNode.changes.forEach((cChange) => {
    newSubChanges.push(...flattenChangeNode(cChange))
  })

  return newSubChanges
}

/**
 * Checks whether a path is under another path within the tree.
 */
const isSubpathOf = (subPath: Path, parentPath: Path): boolean => {
  if (parentPath.length >= subPath.length) {
    return false
  }

  for (let i = 0; i < parentPath.length; i++) {
    if (parentPath[i] !== subPath[i]) {
      return false
    }
  }

  return true
}

const pathSegmentOfCorrectType = (item: Record<string, unknown>, child: string): PathSegment => {
  const nextItem = item[child]

  const key = getItemKey(nextItem)

  if (key) {
    return {_key: key}
  }

  const isArray = Array.isArray(item)

  if (isArray) {
    return parseInt(child, 10)
  }

  return child
}

export {isAddedAction, flattenChangeNode, isSubpathOf, pathSegmentOfCorrectType}
