import getDefaultModule from './getDefaultModule'

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

type SortDirection = 'asc' | 'desc'

interface SortItem {
  field: string
  direction: SortDirection
}

interface Ordering {
  title: string
  name?: string
  by: SortItem[]
}

export interface SchemaType {
  name: string
  title?: string
  icon?: Function
  type?: SchemaType
  to?: SchemaField[]
  fields?: SchemaField[]
  orderings?: Ordering[]
  initialValue?: Function | {[key: string]: any}
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
