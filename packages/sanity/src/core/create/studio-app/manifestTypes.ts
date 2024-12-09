export type SchemaFile = `${string}.create-schema.json`

export interface StudioManifest {
  version: 1
  createdAt: string
  workspaces: SerializedManifestWorkspace[]
}

export interface SerializedManifestWorkspace {
  name: string
  title: string
  subtitle?: string
  basePath: `/${string}`
  dataset: string
  schema: SchemaFile
}
