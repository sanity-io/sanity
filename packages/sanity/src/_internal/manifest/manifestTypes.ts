export type ManifestSerializable =
  | string
  | number
  | boolean
  | {[k: string]: ManifestSerializable}
  | ManifestSerializable[]

export interface ManifestV1 {
  version: 1
  createdAt: string
  workspaces: ManifestWorkspace[]
}

export interface ManifestWorkspace {
  name: string
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
  readOnly?: boolean | 'function'
  hidden?: boolean | 'function'
  validation?: ManifestValidationGroup[]
  fields?: ManifestField[]
  to?: ManifestReferenceMember[]
  of?: ManifestArrayMember[]
  preview?: {
    select: Record<string, string>
  }
  options?: Record<string, ManifestSerializable>

  //portable text
  marks?: {
    annotations?: ManifestArrayMember[]
    decorators?: TitledValue[]
  }
  lists?: TitledValue[]
  styles?: TitledValue[]
}

export interface TitledValue {
  value: string
  title?: string
}

export type ManifestField = ManifestSchemaType
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
