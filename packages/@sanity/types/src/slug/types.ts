import type {SlugSchemaType} from '../schema'
import type {SanityDocument} from '../documents'
import type {Path} from '../paths'

export interface Slug {
  _type: 'slug'
  current: string
}

export type SlugParent = Record<string, unknown> | Record<string, unknown>[]

export interface SlugSourceOptions {
  parentPath: Path
  parent: SlugParent
}

export type SlugSourceFn = (
  document: SanityDocument,
  options: SlugSourceOptions
) => string | Promise<string>

export type SlugifierFn = (source: string, schemaType: SlugSchemaType) => string | Promise<string>

// TODO: De-dupe with validation types
export interface SlugUniqueOptions {
  parent: SlugParent
  type: SlugSchemaType
  document: SanityDocument
  defaultIsUnique: UniqueCheckerFn
  path: Path
}

export type UniqueCheckerFn = (
  slug: string,
  options: SlugUniqueOptions
) => boolean | Promise<boolean>

export interface SlugOptions {
  source?: string | Path | SlugSourceFn
  maxLength?: number
  slugify?: SlugifierFn
  isUnique?: UniqueCheckerFn
}
