import {Annotation} from './types'

export function isSameAnnotation(a: Annotation, b: Annotation): boolean {
  if (a && b) {
    return a.author === b.author && a.chunk === b.chunk
  }

  if (!a && !b) {
    return true
  }

  return false
}
