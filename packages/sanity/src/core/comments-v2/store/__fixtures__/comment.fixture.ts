import {type CommentDocument} from '../../types'

/** A Comments API comment on `documentId` of the `abc.production` dataset */
export function comment(
  _id: string,
  sourceDocumentId: string,
  fields: {field?: string | null; parentCommentId?: string; status?: 'open' | 'resolved'} = {},
): CommentDocument {
  const {field = 'title', parentCommentId, status = 'open'} = fields
  const publishedId = sourceDocumentId.split('.').at(-1) ?? sourceDocumentId
  return {
    _type: 'sanity.comment',
    _id,
    _rev: `${_id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _system: {createdBy: 'user'},
    message: null,
    threadId: parentCommentId ?? _id,
    ...(parentCommentId ? {parentCommentId} : {}),
    status,
    reactions: null,
    target: {
      ...(field === null ? {} : {path: {field}}),
      sourceDocumentId,
      documentType: 'article',
      document: {
        _type: 'globalDocumentReference',
        _ref: `dataset:abc.production:${publishedId}`,
        _weak: true,
      },
    },
  }
}
