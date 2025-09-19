export interface IntentFilter {
  projectId?: string
  dataset?: string
  types?: string[]
}

export interface Intent {
  id: string
  action: 'view' | 'edit' | 'create' | 'delete'
  title: string
  description?: string
  filters: IntentFilter[]
  applicationId: string
}
