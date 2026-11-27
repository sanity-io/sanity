import {type Action, type SanityClient} from '@sanity/client'

import {getDraftId, getVersionId} from '../../util/draftUtils'

/**
 * Creates a version of the document group's default variant in drafts, or in a release when
 * `bundleId` is set: a copy of `base`, or an empty document when there is none.
 *
 * @param bundleId - The release id (not the release document id) to create the version in.
 */
export function createDefaultVersion({
  client,
  documentGroupId,
  documentType,
  bundleId,
  base,
  signal,
}: {
  client: Pick<SanityClient, 'action'>
  documentGroupId: string
  documentType: string
  bundleId: string | undefined
  base: {_id: string; _rev?: string} | undefined
  signal: AbortSignal
}) {
  const versionId =
    typeof bundleId === 'undefined'
      ? getDraftId(documentGroupId)
      : getVersionId(documentGroupId, bundleId)

  const action: Action =
    typeof base === 'undefined'
      ? {
          actionType: 'sanity.action.document.version.create',
          publishedId: documentGroupId,
          document: {_id: versionId, _type: documentType},
        }
      : {
          actionType: 'sanity.action.document.version.create',
          publishedId: documentGroupId,
          versionId,
          baseId: base._id,
          ...(typeof base._rev === 'string' ? {ifBaseRevisionId: base._rev} : {}),
        }

  return client.action(action, {tag: 'document.create-version', signal})
}
