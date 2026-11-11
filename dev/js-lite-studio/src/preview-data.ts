/** The preview of a document as lists, references and search show it. */
import {schema} from './schema'
import {isObject, type JsonObject, previewText, publishedId} from './util'

export interface DocPreview {
  /** The published id, also for documents that only exist as a draft. */
  id: string
  typeName: string
  title?: string
  subtitle?: string
  /** An image asset reference. */
  media?: string
  updatedAt?: string
  /** The draft is what the preview shows, ie there are unpublished changes. */
  draft: boolean
}

/** Reads a document projected with `Schema.previewProjection` in the `drafts` perspective. */
export function previewFromProjection(value: unknown): DocPreview | undefined {
  if (!isObject(value) || typeof value._id !== 'string') return undefined
  const text = (key: string) =>
    typeof value[key] === 'string' ? (value[key] as string) : undefined
  return {
    id: publishedId(value._id),
    typeName: text('_type') ?? '',
    title: previewText(value.title),
    subtitle: previewText(value.subtitle),
    media: text('media'),
    updatedAt: text('_updatedAt'),
    draft: (text('_originalId') ?? '').startsWith('drafts.'),
  }
}

/** The preview of a document the store holds, from its current local version, so lists and
 * headers follow edits as they are typed. */
export function previewFromDocument(id: string, doc: JsonObject, draft: boolean): DocPreview {
  const typeName = typeof doc._type === 'string' ? doc._type : ''
  const preview = schema().preview(typeName)
  const field = (name: string | undefined) => (name ? doc[name] : undefined)
  const media = field(preview.media)
  const asset = isObject(media) && isObject(media.asset) ? media.asset._ref : undefined
  return {
    id,
    typeName,
    title: previewText(field(preview.title)),
    subtitle: previewText(field(preview.subtitle)),
    media: typeof asset === 'string' ? asset : undefined,
    updatedAt: typeof doc._updatedAt === 'string' ? doc._updatedAt : undefined,
    draft,
  }
}
