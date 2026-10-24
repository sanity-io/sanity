import {type SoftNavigationChange} from '../__telemetry__/performance.telemetry'

const INSPECTOR_PARAMS = new Set(['inspect'])
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

function toStudioLocation(url: string, basePath: string): StudioLocation | undefined {
  try {
    const {pathname, searchParams} = new URL(url)
    const baseSegments = basePath.split('/').filter(Boolean)
    const [tool = '', ...toolSegments] = pathname
      .split('/')
      .filter(Boolean)
      .slice(baseSegments.length)
    return {tool, toolSegments, search: searchParams}
  } catch {
    return undefined
  }
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

function hasSamePanes(previous: StructurePanes, next: StructurePanes): boolean {
  return previous.paneIds.join('|') === next.paneIds.join('|')
}

function closesPanes(previous: StructurePanes, next: StructurePanes): boolean {
  return (
    next.paneIds.length < previous.paneIds.length &&
    next.paneIds.every((paneId, index) => previous.paneIds[index] === paneId)
  )
}

function isIntentLink(location: StudioLocation): boolean {
  return location.tool === 'intent' || location.toolSegments[0] === 'intent'
}

function describeStructureChange(
  previous: StudioLocation,
  next: StudioLocation,
  nextRoute: string,
): SoftNavigationChange {
  const previousPanes = toStructurePanes(previous.toolSegments[0])
  const nextPanes = toStructurePanes(next.toolSegments[0])

  if (hasSamePanes(previousPanes, nextPanes)) {
    const keys = changedKeys(previousPanes.params, nextPanes.params)
    if (keys.some((key) => INSPECTOR_PARAMS.has(key))) return 'inspector-toggle'
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

  if (input.nextRoute.startsWith('intent:') || isIntentLink(next)) return 'document-open'
  if (previous.tool !== next.tool) return 'tool-switch'
  if (previous.search.get('perspective') !== next.search.get('perspective')) {
    return 'perspective-change'
  }
  if (previous.toolSegments.join('/') === next.toolSegments.join('/')) {
    return previous.search.toString() === next.search.toString() ? 'other' : 'filter-change'
  }
  if (next.tool === 'structure') return describeStructureChange(previous, next, input.nextRoute)
  return 'other'
}
