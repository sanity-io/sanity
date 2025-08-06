export interface ReleaseTemplate {
  _id: string
  _type: 'test-release-template'
  _createdAt: string
  _updatedAt: string
  _rev: string
  title: string
  description?: string
  selectedDocumentTypes: string[]
  authorId: string
  usages: number
}

export interface ReleaseTemplateCreatePayload {
  title: string
  description?: string
  selectedDocumentTypes: string[]
}

export type ReleaseTemplateDocument = ReleaseTemplate

export interface ReleaseTemplateUpdatePayload {
  _id: string
  title: string
  description?: string
  selectedDocumentTypes: string[]
}

export interface ReleaseTemplateOperations {
  create: (template: ReleaseTemplateCreatePayload) => Promise<ReleaseTemplateDocument>
  list: () => Promise<ReleaseTemplateDocument[]>
  remove: (id: string) => Promise<void>
  update: (template: ReleaseTemplateUpdatePayload) => Promise<ReleaseTemplateDocument>
  incrementUsage: (id: string) => Promise<void>
}
