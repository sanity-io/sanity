import {getStructurePaneKind} from './paneKindRegistry'

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

function toStructureRegistryKey(paneSegment: string | undefined): string {
  return (paneSegment ?? '')
    .split(';')
    .filter(Boolean)
    .map((group) => group.split(',')[0])
    .join(';')
}

function toToolRoute(toolName: string, firstToolSegment: string | undefined): string {
  if (toolName === 'structure') {
    const kind = getStructurePaneKind(toStructureRegistryKey(firstToolSegment)) ?? OTHER
    return `structure:${kind}`
  }
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
