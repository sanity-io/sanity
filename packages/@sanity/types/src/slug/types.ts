import {SanityClient} from '@sanity/client'
import type {SlugSchemaType} from '../schema'
import {Schema} from '../schema'
import type {SanityDocument} from '../documents'
import type {Path} from '../paths'
import {CurrentUser} from '../user'

export interface Slug {
  _type: 'slug'
  current: string
}

export type SlugParent = Record<string, unknown> | Record<string, unknown>[]

export interface SlugSourceContext {
  parentPath: Path
  parent: SlugParent
  projectId: string
  dataset: string
  schema: Schema
  currentUser: CurrentUser | null
  getClient: (options: {apiVersion: string}) => SanityClient
}

export type SlugSourceFn = (
  document: SanityDocument,
  context: SlugSourceContext
) => string | Promise<string>

export type SlugifierFn = (
  source: string,
  schemaType: SlugSchemaType,
  context: SlugSourceContext
) => string | Promise<string>
