/** The projection Documents renders, and the shape the guidance shows */
export const DOCUMENT_LIST_SHAPE = '*[]{_id, _type, title?, subtitle?, media?}'

/** One row, taken from the result. Only `_id` is required */
export interface DocumentListDocument {
  _id: string
  _type?: string
  title?: string
  subtitle?: string
  media?: unknown
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
