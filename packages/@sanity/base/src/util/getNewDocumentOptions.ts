// @todo: remove the following line when part imports has been removed from this file
/// <reference types="@sanity/types/parts" />

import schema from 'part:@sanity/base/schema'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import {SchemaType} from '@sanity/types'
import {isObject} from 'lodash'
import {getTemplateById} from '@sanity/initial-value-templates'
import S from '../_exports/structure-builder'
import type {InitialValueTemplateItem} from '@sanity/structure'

const isRecord = isObject as (value: unknown) => value is Record<string, unknown>
const isInitialValueTemplateItem = (
  obj: Record<string, unknown>
): obj is InitialValueTemplateItem => obj.type === 'initialValueTemplateItem'
const serialize = <T extends Record<string, unknown>>(t: T | {serialize: () => T}): T =>
  typeof t.serialize === 'function' ? serialize(t.serialize()) : t
const quote = (str: string | undefined) => (str && str.length > 0 ? ` "${str}"` : str || '')
const getDefaultModule = <T>(mod: {__esModule?: boolean; default: T} | T) =>
  isRecord(mod) && '__esModule' in mod ? mod.default : mod

type Template = NonNullable<ReturnType<typeof getTemplateById>>

interface NewDocumentPreview {
  title: string
  description?: string
  subtitle?: string
  icon?: React.ElementType | React.ReactElement
}

interface NewDocumentIntent {
  intent: 'create'
  params: [
    // router params
    {type: string; template: string},
    // router payload
    InitialValueTemplateItem['parameters']
  ]
}

/**
 * The result of parsing the `new-document-structure` against the registered
 * initial value templates.
 */
export interface NewDocumentOption {
  /**
   * a unique key for this option
   */
  key: string

  /**
   * the matching template
   */
  template: Template
  /**
   * the array item in the new-document structure that was used to create this
   * option
   */
  item: InitialValueTemplateItem

  /**
   * a pre-made intent ready to pass to intent links
   */
  intent: NewDocumentIntent

  /**
   * a set of display values to show to the user
   */
  preview: NewDocumentPreview
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
export function getNewDocumentOptions(): NewDocumentOption[] {
  // this has to be deferred/lazy-loaded due to some weird dependency orderings
  const newDocumentStructure = getDefaultModule(
    require('part:@sanity/base/new-document-structure?')
  )

  try {
    return createNewDocumentOptions(
      serializeNewDocumentStructure(newDocumentStructure || S.defaultInitialValueTemplateItems())
    )
  } catch (err) {
    console.error(
      `Invalid "new document" configuration: ${err?.message}. Falling back to default structure.`
    )

    return createNewDocumentOptions(
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

function createNewDocumentOptions(structure: InitialValueTemplateItem[]) {
  return (
    structure
      .map((item) => {
        // Make sure the template actually exists
        const template = getTemplateById(item.templateId)
        if (!template) {
          throw new Error(`Template "${item.templateId}" not declared`)
        }

        // Build up an item suited for the "action modal" dialog
        const type = schema.get(template.schemaType) as SchemaType
        if (!type) {
          throw new Error(`Schema type "${template.schemaType}" not declared`)
        }

        const title = item.title || template.title
        const newDocumentOption: NewDocumentOption = {
          key: item.id,
          intent: {
            intent: 'create',
            params: [{template: template.id, type: template.schemaType}, item.parameters],
          },
          preview: {
            title,
            description: item.description || template.description,
            // Don't show the type name as subtitle if it's the same as the template name
            subtitle: type.title === title ? undefined : type.title,
            // Prioritize icon from initial value template item
            icon: item.icon || template.icon || type.icon,
          },
          template,
          item,
        }

        return newDocumentOption
      })
      // Don't include templates for schema types we cannot actually create
      .filter(({template}) => {
        const canCreate = isActionEnabled(schema.get(template.schemaType), 'create')

        if (!canCreate) {
          console.error(
            `Template with ID "${template.id}" has schema type "${template.schemaType}", where the "create" action is disabled and will not be included in the "new document"-dialog.`
          )
        }
        return canCreate
      })
      // Don't include templates that have defined parameters but no parameters are provided for the template item
      .filter(({template, item}) => {
        const hasMissingParams =
          !item.parameters && template.parameters && template.parameters.length > 0

        if (hasMissingParams) {
          console.error(
            `Template with ID "${template.id}" requires a set of parameters, but none were given. Skipping.`
          )
        }

        return !hasMissingParams
      })
  )
}
