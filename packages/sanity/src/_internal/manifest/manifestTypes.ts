export type ManifestSerializable =
  | string
  | number
  | boolean
  | {[k: string]: ManifestSerializable}
  | ManifestSerializable[]

export interface CreateManifest {
  version: 1
  createdAt: string
  workspaces: ManifestWorkspaceFile[]
}

export interface ManifestWorkspaceFile {
  name: string
  dataset: string
  schema: string // filename
}

export interface CreateWorkspaceManifest {
  name: string
  title?: string
  subtitle?: string
  basePath: string
  dataset: string
  schema: ManifestSchemaType[]
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
