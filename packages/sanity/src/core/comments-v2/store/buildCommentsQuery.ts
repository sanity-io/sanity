import {getDraftId, getPublishedId, isDraftId, isPublishedId} from '../../util/draftUtils'
import {type CommentsType} from '../types'

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
 * Field comments require `target.path.field`. The studio only anchors those to
 * fields. Task comments are document-level and intentionally path-less.
 */
export function buildCommentsQuery(options: {
  gdr: string | null
  versionId: string
  type: CommentsType
}) {
  const {gdr, versionId, type} = options
  const source = buildSourceFilter(versionId)
  const filters = [
    ...BASE_FILTERS,
    ...(type === 'field' ? ['defined(target.path.field)'] : []),
    source.filter,
  ].join(' && ')

  return {
    query: `*[${filters}] ${QUERY_PROJECTION} | order(_createdAt desc)`,
    params: {
      gdr,
      ...source.params,
    },
  }
}
