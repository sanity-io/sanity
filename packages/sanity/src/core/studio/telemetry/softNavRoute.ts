const KNOWN_INTENT_NAMES = new Set(['create', 'edit', 'duplicate'])

const OTHER = 'other'

interface SoftNavRouteInput {
  /** The `navigationURL` field of a soft-navigation web-vitals metric. */
  navigationURL: string
  basePath: string
  toolNames: string[]
}

function toPathSegments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

function stripBasePath(pathname: string, basePath: string): string[] {
  const pathSegments = toPathSegments(pathname)
  const baseSegments = toPathSegments(basePath)

  const matchesBase = baseSegments.every((segment, index) => pathSegments[index] === segment)
  return matchesBase ? pathSegments.slice(baseSegments.length) : []
}

function toIntentRoute(intentName: string | undefined): string {
  if (intentName && KNOWN_INTENT_NAMES.has(intentName)) return `intent:${intentName}`
  return `intent:${OTHER}`
}

function toStructurePaneKind(paneSegment: string | undefined): 'list' | 'document' {
  const groups = (paneSegment ?? '').split(';').filter(Boolean)
  // Assumes the common structure shape: list, then the document it opens, then a list inside it, and so on.
  const depth = Math.max(groups.length - 1, 0)
  return depth % 2 === 0 ? 'list' : 'document'
}

function toToolRoute(toolName: string, firstToolSegment: string | undefined): string {
  if (toolName === 'structure') return `structure:${toStructurePaneKind(firstToolSegment)}`
  return toolName
}

export function toSoftNavRoute(input: SoftNavRouteInput): string {
  let pathname: string
  try {
    pathname = new URL(input.navigationURL).pathname
  } catch {
    return OTHER
  }

  const toolSegments = stripBasePath(pathname, input.basePath)
  if (toolSegments.length === 0) return OTHER

  const [toolName, firstToolSegment] = toolSegments
  if (toolName === 'intent') return toIntentRoute(firstToolSegment)
  if (input.toolNames.includes(toolName)) return toToolRoute(toolName, firstToolSegment)

  return OTHER
}
