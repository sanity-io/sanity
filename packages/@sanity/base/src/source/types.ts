import {Template} from '@sanity/initial-value-templates'
import {Schema} from '@sanity/types'
import {DocumentNodeResolver} from '../structure'

export interface SanitySource {
  projectId: string
  dataset: string
  name: string
  title: string
  initialValueTemplates: Template[]
  schema: Schema
  default?: boolean
  structureDocumentNode?: DocumentNodeResolver
}
