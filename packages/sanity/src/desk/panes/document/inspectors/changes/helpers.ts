import {AnnotationDetails, visitDiff, Diff} from 'sanity'

export function collectLatestAuthorAnnotations(diff: Diff): AnnotationDetails[] {
  const authorMap = new Map<string, AnnotationDetails>()
  visitDiff(diff, (child) => {
    if (child.action === 'unchanged' || !('annotation' in child) || !child.annotation) {
      return true
    }

    const {author, timestamp} = child.annotation
    const previous = authorMap.get(author)
    if (!previous || previous.timestamp < timestamp) {
      authorMap.set(author, child.annotation)
    }

    return true
  })

  return Array.from(authorMap.values()).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
}
