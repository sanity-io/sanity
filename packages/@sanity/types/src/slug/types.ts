import type {SanityClient} from '@sanity/client'
import type {SlugSchemaType, Schema} from '../schema'
import type {SanityDocument} from '../documents'
import type {Path} from '../paths'
import type {CurrentUser} from '../user'

/**
 * A slug object, currently holding a `current` property
 *
 * In the future, this may be extended with a `history` property
 *
 * @public
 */
export interface Slug {
  _type: 'slug'
  current: string
}

/** @public */
export type SlugParent = Record<string, unknown> | Record<string, unknown>[]

/** @public */
export interface SlugSourceContext {
  parentPath: Path
  parent: SlugParent
  projectId: string
  dataset: string
  schema: Schema
  currentUser: CurrentUser | null
  getClient: (options: {apiVersion: string}) => SanityClient
}

/** @public */
export type SlugSourceFn = (
  document: SanityDocument,
  context: SlugSourceContext,
) => string | Promise<string>

/** @public */
export type SlugifierFn = (
  source: string,
  schemaType: SlugSchemaType,
  context: SlugSourceContext,
) => string | Promise<string>
