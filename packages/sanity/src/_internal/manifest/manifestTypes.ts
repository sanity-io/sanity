import {type SanityDocumentLike} from '@sanity/types'

export const SANITY_WORKSPACE_SCHEMA_TYPE = 'sanity.workspace.schema'

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

export type DefaultWorkspaceSchemaId = `${typeof SANITY_WORKSPACE_SCHEMA_TYPE}.${string}`
export type PrefixedWorkspaceSchemaId = `${string}.${DefaultWorkspaceSchemaId}`
export type WorkspaceSchemaId = DefaultWorkspaceSchemaId | PrefixedWorkspaceSchemaId

export interface StoredWorkspaceSchema extends SanityDocumentLike {
  _type: typeof SANITY_WORKSPACE_SCHEMA_TYPE
  _id: WorkspaceSchemaId
  workspace: ManifestWorkspaceFile
  /**
   * JSON.stringify version of ManifestSchemaType[] to save on attribute paths.
   * Consumers must use JSON.parse on the value.
   */
  schema: string
  //schema: ManifestSchemaType[]
}
