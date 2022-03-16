import {Schema} from '@sanity/types'
import {Template} from './Template'

export function getParameterlessTemplatesBySchemaType(
  schema: Schema,
  templates: Template[],
  schemaType: string
): Template[] {
  return getTemplatesBySchemaType(schema, templates, schemaType).filter(
    (tpl) => !tpl.parameters || !tpl.parameters.length
  )
}

export function getTemplatesBySchemaType(
  schema: Schema,
  templates: Template[],
  schemaType: string
): Template[] {
  return templates.filter((tpl) => tpl.schemaType === schemaType)
}

export function getTemplateById(
  schema: Schema,
  templates: Template[],
  id: string
): Template | undefined {
  return templates.find((tpl) => tpl.id === id)
}

export function templateExists(schema: Schema, templates: Template[], id: string): boolean {
  return Boolean(getTemplateById(schema, templates, id))
}
