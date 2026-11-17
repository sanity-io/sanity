import {getStructurePaneKind, isStructureTool} from './paneKindRegistry'

const KNOWN_INTENT_NAMES = new Set(['create', 'edit', 'duplicate'])

const OTHER = 'other'

interface SoftNavRouteInput {
  /** The `navigationURL` field of a soft-navigation web-vitals metric. */
  navigationURL: string
  basePath: string
  toolNames: string[]
}

export function toToolPathSegments(navigationURL: string, basePath: string): string[] {
  let pathname: string
  try {
    pathname = new URL(navigationURL).pathname
  } catch {
    return []
  }

  const pathSegments = pathname.split('/').filter(Boolean)
  const baseSegments = basePath.split('/').filter(Boolean)

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

function toRegistryPathFromUrl(decodedSegment: string): string {
  return decodedSegment
    .split(';')
    .filter(Boolean)
    .map((group) => group.split('|')[0].split(',')[0])
    .join(';')
}

function toStructurePaneKind(toolName: string, paneSegment: string | undefined): string {
  // The router percent-encodes each ';' group whole, so ',' params and '|' siblings are only literal once decoded.
  const decodedSegment = decodePaneSegment(paneSegment ?? '')
  if (decodedSegment === undefined) return OTHER
  return getStructurePaneKind(toolName, toRegistryPathFromUrl(decodedSegment)) ?? OTHER
}

export function toSoftNavRoute(input: SoftNavRouteInput): string {
  const toolSegments = toToolPathSegments(input.navigationURL, input.basePath)
  if (toolSegments.length === 0) return OTHER

  const [toolName, firstToolSegment, secondToolSegment] = toolSegments
  if (toolName === 'intent') return toIntentRoute(firstToolSegment)
  if (input.toolNames.includes(toolName)) {
    if (firstToolSegment === 'intent') return toIntentRoute(secondToolSegment)
    if (isStructureTool(toolName))
      return `structure:${toStructurePaneKind(toolName, firstToolSegment)}`
    return toolName
  }

  return OTHER
}
