export interface IntentFilter {
  projectId?: string
  dataset?: string
  types?: string[]
}

export interface IntentDefinition {
  id: string
  action: string
  title: string
  description: string
  filters: IntentFilter[]
}
