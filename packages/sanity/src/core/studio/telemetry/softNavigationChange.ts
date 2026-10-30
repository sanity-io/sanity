import {type SoftNavigationChange} from '../__telemetry__/performance.telemetry'
import {toToolPathSegments} from './softNavRoute'

const VIEW_PARAMS = new Set(['view', 'since', 'rev'])

interface DescribeChangeInput {
  previousURL: string
  nextURL: string
  /** The `toSoftNavRoute` descriptor of `nextURL`. */
  nextRoute: string
  basePath: string
}

interface StudioLocation {
  tool: string
  toolSegments: string[]
  search: URLSearchParams
}

interface StructurePanes {
  paneIds: string[]
  params: string[]
}

function toSearchParams(url: string): URLSearchParams {
  try {
    return new URL(url).searchParams
  } catch {
    return new URLSearchParams()
  }
}

function toStudioLocation(url: string, basePath: string): StudioLocation | undefined {
  const [tool, ...toolSegments] = toToolPathSegments(url, basePath)
  return tool ? {tool, toolSegments, search: toSearchParams(url)} : undefined
}

function decodePanesSegment(panesSegment: string): string {
  try {
    return decodeURIComponent(panesSegment)
  } catch {
    return panesSegment
  }
}

function toStructurePanes(panesSegment: string | undefined): StructurePanes {
  const siblings = decodePanesSegment(panesSegment ?? '')
    .split(';')
    .filter(Boolean)
    .flatMap((group) => group.split('|'))
    .map((sibling) => sibling.split(','))
  return {
    paneIds: siblings.map(([paneId]) => paneId),
    params: siblings.flatMap(([, ...chunks]) => chunks.filter((chunk) => chunk.includes('='))),
  }
}

function changedKeys(previous: string[], next: string[]): string[] {
  const previousEntries = new Set(previous)
  const nextEntries = new Set(next)
  return [...previousEntries, ...nextEntries]
    .filter((entry) => previousEntries.has(entry) !== nextEntries.has(entry))
    .map((entry) => entry.slice(0, entry.indexOf('=')))
}

function closesPanes(previous: StructurePanes, next: StructurePanes): boolean {
  return (
    next.paneIds.length < previous.paneIds.length &&
    next.paneIds.every((paneId, index) => previous.paneIds[index] === paneId)
  )
}

function describeStructureChange(
  previous: StudioLocation,
  next: StudioLocation,
  nextRoute: string,
  perspectiveChanged: boolean,
): SoftNavigationChange {
  const previousPanes = toStructurePanes(previous.toolSegments[0])
  const nextPanes = toStructurePanes(next.toolSegments[0])

  if (previousPanes.paneIds.join('|') === nextPanes.paneIds.join('|')) {
    if (perspectiveChanged) return 'perspective-change'
    const keys = changedKeys(previousPanes.params, nextPanes.params)
    if (keys.includes('inspect')) return 'inspector-toggle'
    if (keys.some((key) => VIEW_PARAMS.has(key))) return 'view-change'
    return 'other'
  }

  if (closesPanes(previousPanes, nextPanes)) return 'other'
  return nextRoute === 'structure:document' ? 'document-open' : 'pane-open'
}

/**
 * Names what a soft navigation changed, so UI-state changes (view tabs, inspector,
 * perspective, filters) can be told apart from real navigations.
 *
 * @internal
 */
export function describeChange(input: DescribeChangeInput): SoftNavigationChange {
  const previous = toStudioLocation(input.previousURL, input.basePath)
  const next = toStudioLocation(input.nextURL, input.basePath)
  if (previous === undefined || next === undefined) return 'other'

  const isIntentLink = next.tool === 'intent' || next.toolSegments[0] === 'intent'
  if (input.nextRoute.startsWith('intent:') || isIntentLink) return 'document-open'
  if (previous.tool !== next.tool) return 'tool-switch'
  const perspectiveChanged = previous.search.get('perspective') !== next.search.get('perspective')
  if (previous.toolSegments.join('/') === next.toolSegments.join('/')) {
    if (perspectiveChanged) return 'perspective-change'
    return previous.search.toString() === next.search.toString() ? 'other' : 'filter-change'
  }
  if (input.nextRoute.startsWith('structure:')) {
    return describeStructureChange(previous, next, input.nextRoute, perspectiveChanged)
  }
  return perspectiveChanged ? 'perspective-change' : 'other'
}
