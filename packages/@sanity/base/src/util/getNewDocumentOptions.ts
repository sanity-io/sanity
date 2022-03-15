import {DocumentIcon} from '@sanity/icons'
import {getTemplateById, Template} from '@sanity/initial-value-templates'
import {isActionEnabled} from '@sanity/schema/_internal'
import {InitialValueTemplateItem, StructureBuilder} from '@sanity/structure'
import {Schema, SchemaType} from '@sanity/types'
import {isRecord} from './isRecord'

// const isRecord = isObject as (value: unknown) => value is Record<string, unknown>
const isInitialValueTemplateItem = (
  obj: Record<string, unknown>
): obj is InitialValueTemplateItem => obj.type === 'initialValueTemplateItem'
const serialize = <T extends Record<string, unknown>>(t: T | {serialize: () => T}): T =>
  typeof t.serialize === 'function' ? serialize(t.serialize()) : t
const quote = (str: string | undefined) => (str && str.length > 0 ? ` "${str}"` : str || '')

function computeOnce<T extends (...args: any[]) => unknown>(fn: T): T {
  let cached: unknown

  return ((...args: any[]) => {
    if (cached) return cached
    cached = fn(...args)
    return cached
  }) as T
}

/**
 * The result of parsing the `new-document-structure` against the registered
 * initial value templates.
 */
export interface NewDocumentOption extends InitialValueTemplateItem {
  subtitle?: string

  /**
   * the matching template
   */
  template: Template
  /**
   * A type that matches the `template.schemaType`
   */
  schemaType: SchemaType
}

/**
 * Returns the result of parsing the `new-document-structure` against the
 * registered initial value templates.
 *
 * This API should be used whenever a new document needs to be created outside
 * the context of the desk tool structure (e.g. references, in the
 * default-layout navbar)
 *
 * Each option returned will correspond to one new-document structure item
 * inside of the array the `new-document-structure` exports (or the default
 * value array from the structure builder)
 */
const getNewDocumentOptionsOnce = computeOnce(getNewDocumentOptions)
export {getNewDocumentOptionsOnce as getNewDocumentOptions}

function getNewDocumentOptions(
  S: StructureBuilder,
  schema: Schema,
  initialValueTemplates: Template[],
  newDocumentStructure: any
): NewDocumentOption[] {
  try {
    return createNewDocumentOptions(
      schema,
      initialValueTemplates,
      serializeNewDocumentStructure(newDocumentStructure || S.defaultInitialValueTemplateItems())
    )
  } catch (err) {
    console.error(
      `Invalid "new document" configuration: ${err?.message}. Falling back to default structure.`
    )

    return createNewDocumentOptions(
      schema,
      initialValueTemplates,
      serializeNewDocumentStructure(S.defaultInitialValueTemplateItems())
    )
  }
}

function serializeNewDocumentStructure(structureItems: unknown): InitialValueTemplateItem[] {
  if (!Array.isArray(structureItems)) {
    throw new Error(
      'Invalid "new document" configuration: "part:@sanity/base/new-document-structure" should return an array of items.'
    )
  }

  const items = structureItems.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(
        `Expected template item at index ${index} to be an object but got ${
          item === null ? 'null' : typeof item
        }`
      )
    }

    const serialized = serialize(item)
    if (!isInitialValueTemplateItem(serialized)) {
      throw new Error(
        `Only initial value template items are currently allowed in the new document structure. Item at index ${index} is invalid`
      )
    }

    return serialized
  })

  const idMap = new Map<string, number>()
  items.forEach((item, i) => {
    const dupeIndex = idMap.get(item.id)

    if (typeof dupeIndex === 'number') {
      throw new Error(
        `Template item${quote(item.title)} at index ${i} has the same ID ("${
          item.id
        }") as template${quote(items[dupeIndex].title)} at index ${dupeIndex}`
      )
    }

    idMap.set(item.id, i)
  })

  return items
}

function createNewDocumentOptions(
  schema: Schema,
  initialValueTemplates: Template[],
  structure: InitialValueTemplateItem[]
) {
  return (
    structure
      .map((item) => {
        // Make sure the template actually exists
        const template = getTemplateById(schema, initialValueTemplates, item.templateId)
        if (!template) {
          throw new Error(`Template "${item.templateId}" not declared`)
        }

        // Build up an item suited for the "action modal" dialog
        const schemaType = schema.get(template.schemaType) as SchemaType
        if (!schemaType) {
          throw new Error(`Schema type "${template.schemaType}" not declared`)
        }

        const title = item.title || template.title
        const newDocumentOption: NewDocumentOption = {
          ...item,
          title,
          description: item.description || template.description,
          // Don't show the type name as subtitle if it's the same as the template name
          subtitle: schemaType.title === title ? undefined : schemaType.title,
          // Prioritize icon from initial value template item
          icon: item.icon || template.icon || schemaType.icon || DocumentIcon,

          template,
          schemaType,
        }

        return newDocumentOption
      })
      // Don't include templates for schema types we cannot actually create
      .filter(({template}) => {
        const schemaType = schema.get(template.schemaType)

        if (!schemaType) {
          throw new Error(`no schema type: "${template.schemaType}"`)
        }

        const canCreate = isActionEnabled(schemaType, 'create')

        if (!canCreate) {
          console.error(
            `Template with ID "${template.id}" has schema type "${template.schemaType}", where the "create" action is disabled and will not be included in the "new document"-dialog.`
          )
        }
        return canCreate
      })
      // Don't include templates that have defined parameters but no parameters are provided for the template item
      .filter(({template, parameters}) => {
        const hasMissingParams =
          !parameters && template.parameters && template.parameters.length > 0

        if (hasMissingParams) {
          console.error(
            `Template with ID "${template.id}" requires a set of parameters, but none were given. Skipping.`
          )
        }

        return !hasMissingParams
      })
  )
}
