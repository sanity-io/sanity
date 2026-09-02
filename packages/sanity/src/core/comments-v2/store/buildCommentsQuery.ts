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

function buildSourceFilter(versionId: string) {
  if (isDraftId(versionId) || isPublishedId(versionId)) {
    const publishedDocumentId = getPublishedId(versionId)
    return {
      filter: 'target.sourceDocumentId in [$publishedDocumentId, $draftDocumentId]',
      params: {
        publishedDocumentId,
        draftDocumentId: getDraftId(publishedDocumentId),
      },
    }
  }

  return {
    filter: 'target.sourceDocumentId == $versionId',
    params: {versionId},
  }
}

/**
 * Full GROQ query + params for listing comments for the editor document.
 *
 * Draft and published share a comment set. Version (and other) ids match exactly.
 *
 * @internal
 */
export function buildCommentsQuery(options: {gdr: string | null; versionId: string}) {
  const {gdr, versionId} = options
  const source = buildSourceFilter(versionId)
  const filters = [...BASE_FILTERS, source.filter].join(' && ')

  return {
    query: `*[${filters}] ${QUERY_PROJECTION} | order(_createdAt desc)`,
    params: {
      gdr,
      ...source.params,
    },
  }
}
