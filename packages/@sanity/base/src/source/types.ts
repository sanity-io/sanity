import {BifurClient} from '@sanity/bifur-client'
import {SanityClient} from '@sanity/client'
import {Template} from '@sanity/initial-value-templates'
import {Schema} from '@sanity/types'
import {DocumentNodeResolver} from '../structure'

export interface SanitySource {
  bifur: BifurClient
  client: SanityClient
  projectId: string
  dataset: string
  name: string
  title: string
  initialValueTemplates: Template[]
  schema: Schema
  default?: boolean
  structureDocumentNode?: DocumentNodeResolver
}
