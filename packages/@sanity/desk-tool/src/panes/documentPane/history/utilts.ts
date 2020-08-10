import {Annotation} from './types'

export function isSameAnnotation(a: Annotation, b: Annotation): boolean {
  if (a.type === 'changed' && b.type === 'changed') {
    return a.author === b.author && a.chunk === b.chunk
  }

  if (a.type === 'unchanged' && b.type === 'unchanged') {
    return true
  }

  return false
}
