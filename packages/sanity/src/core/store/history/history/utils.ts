import {type Annotation} from '../../../field'

export function isSameAnnotation(a: Annotation, b: Annotation): boolean {
  if (a && b) {
    return a.author === b.author && a.timestamp === b.timestamp
  }

  if (!a && !b) {
    return true
  }

  return false
}
