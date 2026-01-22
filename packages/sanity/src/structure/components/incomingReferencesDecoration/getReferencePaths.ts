import {type Path, type SanityDocument} from 'sanity'

const INTERNAL_KEYS = ['_id', '_type', '_createdAt', '_updatedAt', '_rev']
export function getReferencePaths(document: SanityDocument, referenceToId: string): Path[] {
  const referencePaths: Path[] = []

  function traverse(obj: any, currentPath: Path): void {
    if (obj === null || obj === undefined) {
      return
    }

    // Check if current object is a reference
    if (typeof obj === 'object' && obj._ref === referenceToId) {
      referencePaths.push([...currentPath])
      return
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (item && typeof item === 'object' && item._key) {
          // Use _key for array items that have it
          traverse(item, [...currentPath, {_key: item._key}])
        } else {
          // Fallback to index for items without _key
          traverse(item, [...currentPath, index])
        }
      })
      return
    }

    // Handle objects
    if (typeof obj === 'object') {
      Object.keys(obj).forEach((key) => {
        if (INTERNAL_KEYS.includes(key)) {
          return
        }
        traverse(obj[key], [...currentPath, key])
      })
    }
  }

  // Start traversal from document root, excluding Sanity metadata fields
  Object.keys(document).forEach((key) => {
    if (!key.startsWith('_')) {
      traverse(document[key], [key])
    }
  })

  return referencePaths
}
