import getDefaultModule from './getDefaultModule'
import {Ordering} from '../Sort'

interface Schema {
  name: string
  get(typeName: string): any
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
  (selection: {}): PreviewFields
}

export interface SchemaType {
  name: string
  type?: SchemaType
  to?: SchemaField[]
  fields?: SchemaField[]
  orderings?: Ordering[]
  preview?: {
    select?: PreviewFields
    prepare?: PreviewPreparer
  }
}

// We are lazy-loading the part to work around typescript trying to resolve it
const defaultSchema = ((): Schema => {
  const schema: Schema = getDefaultModule(require('part:@sanity/base/schema'))
  return schema
})()

export {Schema, defaultSchema}
