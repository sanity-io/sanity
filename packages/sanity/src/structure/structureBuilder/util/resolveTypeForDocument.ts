import {type SanityClient} from '@sanity/client'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, getPublishedId, type SourceClientOptions} from 'sanity'

export async function resolveTypeForDocument(
  getClient: (options: SourceClientOptions) => SanityClient,
  id: string,
): Promise<string | undefined> {
  const query = '*[sanity::versionOf($publishedId)][0]._type'

  const type = await getClient(DEFAULT_STUDIO_CLIENT_OPTIONS).fetch(
    query,
    {publishedId: getPublishedId(id)},
    {tag: 'structure.resolve-type'},
  )

  return type
}
