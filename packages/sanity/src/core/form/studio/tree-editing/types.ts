import {type Path, type SchemaType} from '@sanity/types'

/**
 * Used for the dialog breadcrumbs and menu items
 */
export interface DialogItem {
  children?: DialogItem[]
  parentSchemaType: SchemaType
  path: Path
  schemaType: SchemaType
  value: unknown | undefined
}
