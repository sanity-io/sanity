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
