import {type Path, type SchemaType} from 'sanity'

export interface TreeEditingMenuItem {
  children?: TreeEditingMenuItem[]
  parentSchemaType: SchemaType
  path: Path
  schemaType: SchemaType
  value: unknown | undefined
}

export type TreeEditingBreadcrumb = TreeEditingMenuItem
