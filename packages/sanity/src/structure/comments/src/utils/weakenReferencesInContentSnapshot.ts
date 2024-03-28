import {type CommentDocument} from '../types'

function weakenReferences(
  node: Partial<Record<string, any>>,
): Partial<Record<string, any>> | undefined {
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
    const result: Partial<Record<string, any>> = {}

    Object.keys(node).forEach((key) => {
      const value = node[key]
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

  // Return undefined for non-objects
  return node
}

export function weakenReferencesInContentSnapshot(
  snapshot: CommentDocument['contentSnapshot'],
): CommentDocument['contentSnapshot'] {
  if (!snapshot) return snapshot

  return Array.isArray(snapshot) ? snapshot.map(weakenReferences) : weakenReferences(snapshot)
}
