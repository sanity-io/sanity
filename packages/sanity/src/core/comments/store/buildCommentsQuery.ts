import {getDraftId, getPublishedId, isDraftId, isPublishedId} from '../../util/draftUtils'

const BASE_FILTERS = [`_type == "sanity.comment"`, `target.document._ref == $gdr`]

const QUERY_PROJECTION = `{
  _createdAt,
  _id,
  _rev,
  _type,
  _system,
  contentSnapshot,
  context,
  lastEditedAt,
  message,
  parentCommentId,
  reactions,
  status,
  target,
  threadId
}`

function buildSourceFilter(sourceDocumentId: string) {
  if (isDraftId(sourceDocumentId) || isPublishedId(sourceDocumentId)) {
    const publishedDocumentId = getPublishedId(sourceDocumentId)
    return {
      filter: 'target.sourceDocumentId in [$publishedDocumentId, $draftDocumentId]',
      params: {
        publishedDocumentId,
        draftDocumentId: getDraftId(publishedDocumentId),
      },
    }
  }

  return {
    filter: 'target.sourceDocumentId == $sourceDocumentId',
    params: {sourceDocumentId},
  }
}

/**
 * Full GROQ query + params for listing comments for the editor document.
 *
 * Draft and published share a comment set. Version (and other) ids match exactly.
 *
 * @internal
 */
export function buildCommentsQuery(options: {gdr: string | null; sourceDocumentId: string}) {
  const {gdr, sourceDocumentId} = options
  const source = buildSourceFilter(sourceDocumentId)
  const filters = [...BASE_FILTERS, source.filter].join(' && ')

  return {
    query: `*[${filters}] ${QUERY_PROJECTION} | order(_createdAt desc)`,
    params: {
      gdr,
      ...source.params,
    },
  }
}
