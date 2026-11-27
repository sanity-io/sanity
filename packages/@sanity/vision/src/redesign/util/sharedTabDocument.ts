import {applyPatches, makePatches} from '@sanity/diff-match-patch'

import {isPlainObject} from '../../util/isPlainObject'
import {type ParsedQueryUrl} from '../../util/parseQueryUrl'
import {type VisionTab, type VisionTabOptions} from '../store/types'

/**
 * What a shared tab edits together, as its `vision.sharedQuery` document holds it. A document
 * shared before tabs were edited together only has its `url`, which is where these are read
 * from until a collaborator edits them.
 */
export interface SharedTabFields {
  query: string
  rawParams: string
  /** `undefined` when the document has none yet: the tab's own stay as they are */
  options: VisionTabOptions | undefined
  title: string | undefined
}

/** The tab options as the document stores them: JSON has no `undefined`, so no perspective is `null` */
type StoredOptions = Omit<VisionTabOptions, 'perspective'> & {
  perspective: Exclude<VisionTabOptions['perspective'], undefined> | null
}

const PERSPECTIVES = new Set(['global', 'raw', 'published', 'drafts', 'scheduledDrafts'])

export function toStoredOptions(options: VisionTabOptions): StoredOptions {
  return {
    datasetMode: options.datasetMode,
    dataset: options.dataset,
    apiVersion: options.apiVersion,
    perspective: options.perspective ?? null,
    variant: options.variant,
    includeSourceMap: options.includeSourceMap,
    useCdn: options.useCdn,
  }
}

function fromStoredOptions(value: unknown): VisionTabOptions | undefined {
  if (!isPlainObject(value)) return undefined
  const {datasetMode, dataset, apiVersion, perspective, variant, includeSourceMap, useCdn} = value
  if (
    (datasetMode !== 'auto' && datasetMode !== 'override') ||
    typeof dataset !== 'string' ||
    typeof apiVersion !== 'string' ||
    (perspective !== null && !(typeof perspective === 'string' && PERSPECTIVES.has(perspective))) ||
    (variant !== 'global' && variant !== 'none') ||
    typeof includeSourceMap !== 'boolean' ||
    typeof useCdn !== 'boolean'
  ) {
    return undefined
  }
  return {
    datasetMode,
    dataset,
    apiVersion,
    perspective: (perspective ?? undefined) as VisionTabOptions['perspective'],
    variant,
    includeSourceMap,
    useCdn,
  }
}

/** Whether two sets of tab options would send the same request */
export function haveSameOptions(a: VisionTabOptions, b: VisionTabOptions): boolean {
  return (
    a.datasetMode === b.datasetMode &&
    a.dataset === b.dataset &&
    a.apiVersion === b.apiVersion &&
    a.perspective === b.perspective &&
    a.variant === b.variant &&
    a.includeSourceMap === b.includeSourceMap &&
    a.useCdn === b.useCdn
  )
}

/**
 * The fields a shared query document holds, falling back to its URL (`parsedUrl`) for a
 * document shared before tabs were edited together
 */
export function readSharedTabFields(
  doc: Record<string, unknown>,
  parsedUrl: ParsedQueryUrl | null,
): SharedTabFields {
  return {
    query: typeof doc.query === 'string' ? doc.query : (parsedUrl?.query ?? ''),
    rawParams: typeof doc.params === 'string' ? doc.params : (parsedUrl?.rawParams ?? ''),
    options: fromStoredOptions(doc.options),
    title: typeof doc.title === 'string' ? doc.title : undefined,
  }
}

/**
 * The `set` patch that brings a shared query document from `synced` to what the tab holds now,
 * or `null` when they agree. The document store's buffer turns a `set` of a string that is
 * already there into a diff-match-patch of the change, as it does for form inputs, so edits
 * made at the same time in different places of the query merge instead of overwriting each
 * other.
 */
export function sharedTabPatch(
  synced: SharedTabFields,
  tab: VisionTab,
  url: string | undefined,
): {set: Record<string, unknown>} | null {
  const set: Record<string, unknown> = {}
  if (tab.query !== synced.query) set.query = tab.query
  if (tab.rawParams !== synced.rawParams) set.params = tab.rawParams
  if (synced.options && !haveSameOptions(tab.options, synced.options)) {
    set.options = toStoredOptions(tab.options)
  }
  if (Object.keys(set).length === 0) return null
  // The URL is what older studios read, and only builds while the params parse
  if (url !== undefined) set.url = url
  return {set}
}

/**
 * Applies the change from `base` to `next` (an edit made elsewhere) to `current`, which may
 * hold local edits `base` does not have yet, as diff-match-patch merges text
 */
export function mergeText(base: string, next: string, current: string): string {
  if (current === base) return next
  if (base === next) return current
  const [merged] = applyPatches(makePatches(base, next), current)
  return merged
}
