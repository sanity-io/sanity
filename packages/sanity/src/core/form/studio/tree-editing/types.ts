import {type Path, type SchemaType} from '@sanity/types'

export interface BreadcrumbItem {
  children?: BreadcrumbItem[]
  parentSchemaType: SchemaType
  path: Path
  schemaType: SchemaType
  value: unknown | undefined
}
