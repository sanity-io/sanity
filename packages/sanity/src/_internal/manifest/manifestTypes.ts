import {type SanityDocumentLike} from '@sanity/types'
import {type MediaLibraryConfig} from 'sanity'

export const SANITY_WORKSPACE_SCHEMA_ID_PREFIX = '_.schemas'
export const SANITY_WORKSPACE_SCHEMA_TYPE = 'system.schema'
export const CURRENT_WORKSPACE_SCHEMA_VERSION = '2025-05-01'

export type ManifestSerializable =
  | string
  | number
  | boolean
  | {[k: string]: ManifestSerializable}
  | ManifestSerializable[]

export interface CreateManifest {
  version: number
  createdAt: string
  workspaces: ManifestWorkspaceFile[]
}

export interface ManifestWorkspaceFile extends Omit<CreateWorkspaceManifest, 'schema' | 'tools'> {
  schema: string // filename
  tools: string // filename
}

export interface CreateWorkspaceManifest {
  name: string
  title?: string
  subtitle?: string
  basePath: string
  dataset: string
  projectId: string
  mediaLibrary?: MediaLibraryConfig
  schema: ManifestSchemaType[]
  tools: ManifestTool[]
  /**
   * returns null in the case of the icon not being able to be stringified
   */
  icon: string | null
}

export interface ManifestSchemaType {
  type: string
  name: string
  title?: string
  deprecated?: {
    reason: string
  }
  readOnly?: boolean | 'conditional'
  hidden?: boolean | 'conditional'
  validation?: ManifestValidationGroup[]
  fields?: ManifestField[]
  to?: ManifestReferenceMember[]
  of?: ManifestArrayMember[]
  preview?: {
    select: Record<string, string>
  }
  fieldsets?: ManifestFieldset[]
  options?: Record<string, ManifestSerializable>
  //portable text
  marks?: {
    annotations?: ManifestArrayMember[]
    decorators?: ManifestTitledValue[]
  }
  lists?: ManifestTitledValue[]
  styles?: ManifestTitledValue[]

  // userland (assignable to ManifestSerializable | undefined)
  // not included to add some typesafty to extractManifest
  // [index: string]: unknown
}

export interface ManifestFieldset {
  name: string
  title?: string
  [index: string]: ManifestSerializable | undefined
}

export interface ManifestTitledValue {
  value: string
  title?: string
}

export type ManifestField = ManifestSchemaType & {fieldset?: string}
export type ManifestArrayMember = Omit<ManifestSchemaType, 'name'> & {name?: string}
export type ManifestReferenceMember = Omit<ManifestSchemaType, 'name'> & {name?: string}

export interface ManifestValidationGroup {
  rules: ManifestValidationRule[]
  message?: string
  level?: 'error' | 'warning' | 'info'
}

export type ManifestValidationRule = {
  flag: string
  constraint?: ManifestSerializable
  [index: string]: ManifestSerializable | undefined
}

export interface ManifestTool {
  name: string
  title: string
  /**
   * returns null in the case of the icon not being able to be stringified
   */
  icon: string | null
  type: string | null
}

export type DefaultWorkspaceSchemaId = `${typeof SANITY_WORKSPACE_SCHEMA_ID_PREFIX}.${string}`
export type PrefixedWorkspaceSchemaId = `${DefaultWorkspaceSchemaId}.${string}`
export type WorkspaceSchemaId = DefaultWorkspaceSchemaId | PrefixedWorkspaceSchemaId

export interface StoredWorkspaceSchema extends SanityDocumentLike {
  _type: typeof SANITY_WORKSPACE_SCHEMA_TYPE
  _id: WorkspaceSchemaId
  /* api-like version string: date at which the format had a meaningful change */
  version: typeof CURRENT_WORKSPACE_SCHEMA_VERSION | undefined
  tag?: string
  workspace: {
    name: string
    title?: string
  }
  /**
   * The API expects JSON coming in, but will store a string to save on attribute paths.
   * Consumers must use JSON.parse on the value, put we deploy to the API using ManifestSchemaType[]
   */
  schema: string | ManifestSchemaType[]
}
