import {Annotation} from '../../../field'
import {CombinedDocument} from './types'

export function isSameAnnotation(a: Annotation, b: Annotation): boolean {
  if (a && b) {
    return a.author === b.author && a.chunk === b.chunk
  }

  if (!a && !b) {
    return true
  }

  return false
}

export function getAttrs(doc: CombinedDocument): Record<string, unknown> | null {
  return doc.draft || doc.published
}
