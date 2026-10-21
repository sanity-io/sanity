import {getStructurePaneKind} from './paneKindRegistry'

const KNOWN_INTENT_NAMES = new Set(['create', 'edit', 'duplicate'])

const OTHER = 'other'

interface SoftNavRouteInput {
  /** The `navigationURL` field of a soft-navigation web-vitals metric. */
  navigationURL: string
  basePath: string
  toolNames: string[]
}

function parsePathname(navigationURL: string): string | undefined {
  try {
    return new URL(navigationURL).pathname
  } catch {
    return undefined
  }
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

function decodePaneSegment(paneSegment: string): string | undefined {
  try {
    return decodeURIComponent(paneSegment)
  } catch {
    return undefined
  }
}

function toStructureRegistryKey(decodedSegment: string): string {
  return decodedSegment
    .split(';')
    .filter(Boolean)
    .map((group) => group.split('|')[0].split(',')[0])
    .join(';')
}

function toStructurePaneKind(paneSegment: string | undefined): string {
  // The router percent-encodes each ';' group whole, so ',' params and '|' siblings are only literal once decoded.
  const decodedSegment = decodePaneSegment(paneSegment ?? '')
  if (decodedSegment === undefined) return OTHER
  return getStructurePaneKind(toStructureRegistryKey(decodedSegment)) ?? OTHER
}

function toToolRoute(toolName: string, firstToolSegment: string | undefined): string {
  if (toolName === 'structure') return `structure:${toStructurePaneKind(firstToolSegment)}`
  return toolName
}

export function toSoftNavRoute(input: SoftNavRouteInput): string {
  const pathname = parsePathname(input.navigationURL)
  if (pathname === undefined) return OTHER

  const toolSegments = stripBasePath(pathname, input.basePath)
  if (toolSegments.length === 0) return OTHER

  const [toolName, firstToolSegment, secondToolSegment] = toolSegments
  if (toolName === 'intent') return toIntentRoute(firstToolSegment)
  if (input.toolNames.includes(toolName)) {
    if (firstToolSegment === 'intent') return toIntentRoute(secondToolSegment)
    return toToolRoute(toolName, firstToolSegment)
  }

  return OTHER
}
