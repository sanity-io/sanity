import {type Path, type SchemaType} from 'sanity'

export interface ArrayEditingBreadcrumb {
  path: Path
  schemaType: SchemaType
  value: unknown | undefined
}
