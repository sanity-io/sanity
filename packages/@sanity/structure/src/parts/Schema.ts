import {Ordering} from '../Sort'
import {FixMe} from '../types'
import getDefaultModule from './getDefaultModule'

interface Schema {
  name: string
  get(typeName: string): SchemaType | undefined
  getTypeNames(): string[]
}

interface SchemaField {
  name: string
  type: SchemaType
}

interface PreviewFields {
  media?: string
}

interface PreviewPreparer {
  (selection: Record<string, unknown>): PreviewFields
}

export interface SchemaType {
  name: string
  title?: string
  icon?: FixMe
  type?: SchemaType
  to?: SchemaField[]
  fields?: SchemaField[]
  orderings?: Ordering[]
  initialValue?: FixMe | {[key: string]: unknown}
  preview?: {
    select?: PreviewFields
    prepare?: PreviewPreparer
  }
}

// We are lazy-loading the part to work around typescript trying to resolve it
const getDefaultSchema = (): Schema => {
  const schema: Schema = getDefaultModule(require('part:@sanity/base/schema'))
  return schema
}

export {Schema, getDefaultSchema}
