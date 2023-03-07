import type {SanityClient} from '@sanity/client'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getDraftId,
  getPublishedId,
  type SourceClientOptions,
} from 'sanity'

export async function resolveTypeForDocument(
  getClient: (options: SourceClientOptions) => SanityClient,
  id: string
): Promise<string | undefined> {
  const query = '*[_id in [$documentId, $draftId]]._type'
  const documentId = getPublishedId(id)
  const draftId = getDraftId(id)

  const types = await getClient(DEFAULT_STUDIO_CLIENT_OPTIONS).fetch(
    query,
    {documentId, draftId},
    {tag: 'structure.resolve-type'}
  )

  return types[0]
}
