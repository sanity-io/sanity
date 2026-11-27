/** The projection Documents renders, and the shape the guidance shows */
export const DOCUMENT_LIST_SHAPE = '*[]{_id, _type, title?, subtitle?, media?}'

/** One row, taken from the result. Only `_id` is required */
export interface DocumentListDocument {
  _id: string
  _type?: string
  title?: string
  subtitle?: string
  media?: unknown
  /** Set on a Content Source Map entry for a document in another project, which rows never open */
  _projectId?: string
  /** Set on a Content Source Map entry for a document in another dataset, which rows never open */
  _dataset?: string
}

export type DocumentListProblem =
  | {kind: 'not-array'}
  | {kind: 'missing-id'; count: number; total: number}

export type ParsedDocumentList =
  | {ok: true; documents: DocumentListDocument[]}
  | {ok: false; problem: DocumentListProblem}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/**
 * Reads a result as a document list. An array is the contract, and `[]` is an empty list. An item
 * counts as missing an id when it is not an object or its `_id` is not a string. `_type`, `title`,
 * `subtitle` and `media` are kept when they are present and ignored otherwise.
 */
export function parseDocumentList(result: unknown): ParsedDocumentList {
  if (!Array.isArray(result)) return {ok: false, problem: {kind: 'not-array'}}

  const documents: DocumentListDocument[] = []
  let missing = 0
  for (const item of result) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      missing += 1
      continue
    }
    const record = item as Record<string, unknown>
    const id = optionalText(record._id)
    if (!id) {
      missing += 1
      continue
    }
    const type = optionalText(record._type)
    const title = optionalText(record.title)
    const subtitle = optionalText(record.subtitle)
    const media = record.media
    documents.push({
      _id: id,
      ...(type ? {_type: type} : {}),
      ...(title ? {title} : {}),
      ...(subtitle ? {subtitle} : {}),
      ...(media != null ? {media} : {}),
    })
  }

  if (missing > 0) {
    return {ok: false, problem: {kind: 'missing-id', count: missing, total: result.length}}
  }
  return {ok: true, documents}
}

/**
 * Reads the `documents` of a Content Source Map as a document list. Every entry has an `_id` and
 * a `_type`, and an entry for a cross-dataset reference also names its `_projectId` and
 * `_dataset`. A source map without documents is an empty list.
 */
export function parseSourceMapDocuments(sourceMap: unknown): ParsedDocumentList {
  const entries =
    typeof sourceMap === 'object' && sourceMap !== null && !Array.isArray(sourceMap)
      ? (sourceMap as Record<string, unknown>).documents
      : undefined
  if (!Array.isArray(entries)) return {ok: true, documents: []}

  const documents: DocumentListDocument[] = []
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue
    const record = entry as Record<string, unknown>
    const id = optionalText(record._id)
    if (!id) continue
    const type = optionalText(record._type)
    const projectId = optionalText(record._projectId)
    const dataset = optionalText(record._dataset)
    documents.push({
      _id: id,
      ...(type ? {_type: type} : {}),
      ...(projectId ? {_projectId: projectId} : {}),
      ...(dataset ? {_dataset: dataset} : {}),
      ...(projectId || dataset ? {subtitle: [projectId, dataset].filter(Boolean).join(' · ')} : {}),
    })
  }
  return {ok: true, documents}
}

/** The row attributes the Documents view reads besides `_id` */
export const DOCUMENT_LIST_ROW_FIELDS = ['_type', 'title', 'subtitle', 'media'] as const

export type DocumentListRowField = (typeof DOCUMENT_LIST_ROW_FIELDS)[number]

/** The row attributes no document of the list has, in the order the view reads them */
export function getMissingRowFields(documents: DocumentListDocument[]): DocumentListRowField[] {
  return DOCUMENT_LIST_ROW_FIELDS.filter((field) =>
    documents.every((document) => document[field] === undefined),
  )
}

/** Which row attributes the schema can give rows of the list's types */
export interface AvailableRowFields {
  title: boolean
  subtitle: boolean
  media: boolean
}

const ALL_ROW_FIELDS_AVAILABLE: AvailableRowFields = {title: true, subtitle: true, media: true}

/**
 * Whether the query could be changed for the Documents view to show it well: the result is not
 * a document list, or none of its rows has a type to open, a title, or either a subtitle or an
 * image, when the schema can give the rows what they miss. A type whose preview has no subtitle
 * or image does not ask again once its rows have what it can give.
 */
export function canImproveDocumentList(
  parsed: ParsedDocumentList,
  available: AvailableRowFields = ALL_ROW_FIELDS_AVAILABLE,
): boolean {
  if (!parsed.ok) return true
  if (parsed.documents.length === 0) return false
  const missing = new Set(getMissingRowFields(parsed.documents))
  return (
    missing.has('_type') ||
    (missing.has('title') && available.title) ||
    (missing.has('subtitle') && missing.has('media') && (available.subtitle || available.media))
  )
}

/** The document types a list's rows name, in the order they first appear */
export function getRowTypes(parsed: ParsedDocumentList): string[] {
  if (!parsed.ok) return []
  return [...new Set(parsed.documents.flatMap((document) => document._type ?? []))]
}

const MAX_DESCRIBED_ATTRIBUTES = 20

function describeValueKind(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'an array'
  return typeof value === 'object' ? 'an object' : `a ${typeof value}`
}

function describeAttributes(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const keys = Object.keys(value)
  if (keys.length === 0) return undefined
  const shown = keys.slice(0, MAX_DESCRIBED_ATTRIBUTES).join(', ')
  return `${shown}${keys.length > MAX_DESCRIBED_ATTRIBUTES ? ', …' : ''}`
}

/**
 * What a result is, in a sentence or two for a prompt that changes its query into a document
 * list: its shape, what the Documents view misses in it, and the attributes of its first item
 */
export function describeDocumentListResult(result: unknown, parsed: ParsedDocumentList): string {
  const sentences: string[] = []
  const first = Array.isArray(result) ? result[0] : result
  if (!parsed.ok) {
    const {problem} = parsed
    sentences.push(
      problem.kind === 'not-array'
        ? `${describeValueKind(result)}, not an array.`
        : `An array of ${problem.total} items, of which ${problem.count} have no _id.`,
    )
  } else {
    const missing = getMissingRowFields(parsed.documents)
    sentences.push(
      `An array of ${parsed.documents.length} documents${
        missing.length > 0 ? `, none of which has ${missing.join(', ')}` : ''
      }.`,
    )
  }
  const attributes = describeAttributes(first)
  if (attributes) {
    sentences.push(`${Array.isArray(result) ? 'The first item' : 'It'} has ${attributes}.`)
  }
  const text = sentences.join(' ')
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`
}
