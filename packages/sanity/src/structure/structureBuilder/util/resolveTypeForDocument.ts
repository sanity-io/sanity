import {type SanityClient} from '@sanity/client'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, getPublishedId, type SourceClientOptions} from 'sanity'

export async function resolveTypeForDocument(
  getClient: (options: SourceClientOptions) => SanityClient,
  id: string,
): Promise<string | undefined> {
  const query = '*[sanity::versionOf($publishedId)][0]._type'

  try {
    return await getClient(DEFAULT_STUDIO_CLIENT_OPTIONS).fetch(
      query,
      {publishedId: getPublishedId(id)},
      {tag: 'structure.resolve-type'},
    )
  } catch (err) {
    // Both structure child resolvers fall back to the "unknown document
    // type" pane when this resolves to undefined — better than letting a
    // failed request crash pane resolution during navigation.
    console.error(new Error(`Failed to resolve document type for "${id}"`, {cause: err}))
    return undefined
  }
}
