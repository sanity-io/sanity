export interface DatasetAliasDefinition {
  name: string
  datasetName: string | null
}

export interface DatasetModificationResponse {
  aliasName: string
  datasetName: string | null
}
