import {type CommentDocument} from '../types'

function weakenReferences(node: unknown): unknown | undefined {
  // Check if the node is directly a reference
  if (node && typeof node === 'object' && node.hasOwnProperty('_ref')) {
    // Return a new object with the _weak property added
    return {...node, _weak: true}
  } else if (Array.isArray(node)) {
    // Check if the node is an array
    // Process each item in the array
    return node.map((item) => weakenReferences(item))
  } else if (node && typeof node === 'object') {
    // For all other objects, create a new object to accumulate the results
    const result: Record<string, unknown> = {}

    // Process each property in the object
    Object.keys(node).forEach((key) => {
      const value = (node as Record<string, unknown>)[key]
      if (typeof value === 'object' && value !== null) {
        // Recursively apply the function to object properties or array items
        result[key] = weakenReferences(value)
      } else {
        // Directly copy other values
        result[key] = value
      }
    })
    return result
  }

  // Return the original value if it is not an object
  return node
}

/**
 * @internal
 */
export function weakenReferencesInContentSnapshot(
  snapshot: CommentDocument['contentSnapshot'],
): CommentDocument['contentSnapshot'] {
  return weakenReferences(snapshot)
}
