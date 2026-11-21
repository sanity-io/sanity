export interface ParsedMediaLibraryReference {
  mediaLibraryId: string
  documentId: string
}

export function parseMediaLibraryReference(ref: string): ParsedMediaLibraryReference | null {
  const [resourceType, mediaLibraryId, documentId, ...rest] = ref.split(':')

  if (rest.length > 0 || resourceType !== 'media-library' || !mediaLibraryId || !documentId) {
    return null
  }

  return {mediaLibraryId, documentId}
}
