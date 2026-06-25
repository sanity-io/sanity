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
    // Returning undefined keeps pane resolution from crashing on a failed
    // request during navigation. The two callers handle it differently:
    // DocumentList falls back to the "unknown document type" pane, while
    // Document throws a SerializeError (no type could be resolved).
    console.error(new Error(`Failed to resolve document type for "${id}"`, {cause: err}))
    return undefined
  }
}
