import {type SanityDocument} from '@sanity/client'

export function getDocumentPreviewTitle(document: SanityDocument): string {
  const title = document.title || document.name

  return typeof title === 'string' && title.trim() ? title : document._id
}
