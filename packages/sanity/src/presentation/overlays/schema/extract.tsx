import {
  type InsertMenuOptions,
  type SchemaArrayNode,
  type SchemaBooleanNode,
  type SchemaInlineNode,
  type SchemaNode,
  type SchemaNullNode,
  type SchemaNumberNode,
  type SchemaObjectField,
  type SchemaObjectNode,
  type SchemaStringNode,
  type SchemaType,
  type SchemaUnionNode,
  type SchemaUnionNodeOptions,
  type SchemaUnionOption,
  type SchemaUnknownNode,
} from '@sanity/presentation-comlink'
import {
  type ArraySchemaType,
  type NumberSchemaType,
  type ObjectSchemaType,
  type ReferenceSchemaType,
  type SchemaType as SanitySchemaType,
  type StringSchemaType,
} from '@sanity/types'
import {type ThemeContextValue} from '@sanity/ui'
import {renderToString} from 'react-dom/server'
import {type Workspace} from 'sanity'

import {
  gatherFields,
  isArrayType,
  isCrossDatasetReferenceType,
  isFieldRequired,
  isNumberType,
  isObjectType,
  isReferenceType,
  isStringType,
  lastType,
  sortByDependencies,
} from './helpers'
import {SchemaIcon} from './SchemaIcon'

const documentDefaultFields = (typeName: string): Record<string, SchemaObjectField> => ({
  _id: {
    type: 'objectField',
    name: '_id',
    value: {
      type: 'string',
    },
  },
  _type: {
    type: 'objectField',
    name: '_type',
    value: {
      type: 'string',
      value: typeName,
    },
  },
  _createdAt: {
    type: 'objectField',
    name: '_createdAt',
    value: {
      type: 'string',
    },
  },
  _updatedAt: {
    type: 'objectField',
    name: '_updatedAt',
    value: {
      type: 'string',
    },
  },
  _rev: {
    type: 'objectField',
    name: '_rev',
    value: {
      type: 'string',
    },
  },
})

function createStringNodeDefintion(
  stringSchemaType: StringSchemaType,
): SchemaStringNode | SchemaUnionNode<SchemaStringNode> {
  const listOptions = stringSchemaType.options?.list
  if (listOptions && Array.isArray(listOptions)) {
    return {
      type: 'union',
      of: listOptions.map((v) => ({
        type: 'string',
        value: typeof v === 'string' ? v : v.value,
      })),
    }
  }
  return {
    type: 'string',
  }
}

function createNumberNodeDefintion(
  numberSchemaType: NumberSchemaType,
): SchemaNumberNode | SchemaUnionNode<SchemaNumberNode> {
  const listOptions = numberSchemaType.options?.list
  if (listOptions && Array.isArray(listOptions)) {
    return {
      type: 'union',
      of: listOptions.map((v) => ({
        type: 'number',
        value: typeof v === 'number' ? v : v.value,
      })),
    }
  }
  return {
    type: 'number',
  }
}

function createReferenceNode(name: string, inArray: boolean = false): SchemaObjectNode {
  const fields: Record<string, SchemaObjectField> = {
    _ref: {
      type: 'objectField',
      name: '_ref',
      value: {
        type: 'string',
      },
    },
    _type: {
      type: 'objectField',
      name: '_type',
      value: {
        type: 'string',
        value: 'reference',
      },
    },
    _weak: {
      type: 'objectField',
      name: '_weak',
      value: {
        type: 'boolean',
      },
      optional: true,
    },
  }

  if (inArray) {
    fields._key = {
      type: 'objectField',
      name: '_key',
      value: {
        type: 'string',
      },
    } satisfies SchemaObjectField
  }

  return {
    type: 'object',
    fields,
    dereferencesTo: name,
  } satisfies SchemaObjectNode
}

function createReferenceNodeDefintion(
  reference: ReferenceSchemaType,
): SchemaObjectNode | SchemaUnionNode<SchemaObjectNode> {
  const references = gatherReferenceNames(reference)
  if (references.length === 1) {
    return createReferenceNode(references[0])
  }

  return {
    type: 'union',
    of: references.map((name) => ({
      type: 'unionOption',
      name,
      value: createReferenceNode(name),
    })),
  }
}

// Traverse the reference type tree and gather all the reference names
function gatherReferenceNames(type: ReferenceSchemaType): string[] {
  const allReferences = gatherReferenceTypes(type)
  // Remove duplicates
  return [...new Set([...allReferences.map((ref) => ref.name)])]
}

function gatherReferenceTypes(type: ReferenceSchemaType): ObjectSchemaType[] {
  const refTo = 'to' in type ? type.to : []
  if ('type' in type && isReferenceType(type.type!)) {
    return [...gatherReferenceTypes(type.type), ...refTo]
  }

  return refTo
}

const typesMap = new Map<string, Omit<SchemaStringNode, 'name'> | Omit<SchemaBooleanNode, 'name'>>([
  ['text', {type: 'string'}],
  ['url', {type: 'string'}],
  ['datetime', {type: 'string'}],
  ['date', {type: 'string'}],
  ['boolean', {type: 'boolean'}],
  ['email', {type: 'string'}],
])

export function extractSchema(workspace: Workspace, theme: ThemeContextValue): SchemaType[] {
  const inlineFields = new Set<SanitySchemaType>()
  const {schema: schemaDef, basePath} = workspace

  const sortedSchemaTypeNames = sortByDependencies(schemaDef)
  return sortedSchemaTypeNames
    .map((typeName) => {
      const schemaType = schemaDef.get(typeName)
      if (schemaType === undefined) {
        return undefined
      }
      const base = convertBaseType(schemaType)

      if (base === null) {
        return undefined
      }

      if (base.type === 'type') {
        inlineFields.add(schemaType)
      }

      return base
    })
    .filter((type: SchemaType | undefined): type is SchemaType => type !== undefined)

  function extractIcon(schemaType: SanitySchemaType): string | undefined {
    if (!schemaType.icon) return undefined
    return renderToString(<SchemaIcon schemaType={schemaType} theme={theme} />)
  }

  function convertBaseType(schemaType: SanitySchemaType): SchemaType | null {
    let typeName: string | undefined
    if (schemaType.type) {
      typeName = schemaType.type.name
    } else if ('jsonType' in schemaType) {
      typeName = schemaType.jsonType
    }

    if (typeName === 'document') {
      const object = createObject(schemaType)
      if (object.type === 'unknown') {
        return null
      }

      return {
        type: 'document',
        name: schemaType.name,
        title: typeof schemaType.title === 'string' ? schemaType.title : undefined,
        icon: extractIcon(schemaType),
        fields: {
          ...documentDefaultFields(schemaType.name),
          ...object.fields,
        },
      }
    }

    const value = convertSchemaType(schemaType)
    if (value.type === 'unknown') {
      return null
    }

    if (value.type === 'object') {
      return {
        name: schemaType.name,
        type: 'type',
        value: {
          type: 'object',
          fields: {
            _type: {
              type: 'objectField',
              name: '_type',
              value: {
                type: 'string',
                value: schemaType.name,
              },
            },
            ...value.fields,
          },
        },
      }
    }

    return {
      name: schemaType.name,
      title: typeof schemaType.title === 'string' ? schemaType.title : undefined,
      type: 'type',
      value,
    }
  }

  function createObject(
    schemaType: ObjectSchemaType | SanitySchemaType,
  ): SchemaObjectNode | SchemaUnknownNode {
    const fields: Record<string, SchemaObjectField> = {}

    for (const field of gatherFields(schemaType)) {
      const value = convertSchemaType(field.type)
      if (value === null) {
        continue
      }

      fields[field.name] = {
        type: 'objectField',
        name: field.name,
        title: typeof field.type.title === 'string' ? field.type.title : undefined,
        value,
        optional: isFieldRequired(field) === false,
      }
    }

    return {
      type: 'object',
      fields,
    }
  }

  function convertSchemaType(schemaType: SanitySchemaType): SchemaNode {
    if (lastType(schemaType)?.name === 'document') {
      return createReferenceNode(schemaType.name)
    }

    if (inlineFields.has(schemaType.type!)) {
      return {type: 'inline', name: schemaType.type!.name} satisfies SchemaInlineNode
    }

    if (schemaType.type?.type?.name === 'object') {
      return {type: 'inline', name: schemaType.type.name} satisfies SchemaInlineNode
    }

    if (isStringType(schemaType)) {
      return createStringNodeDefintion(schemaType)
    }

    if (isNumberType(schemaType)) {
      return createNumberNodeDefintion(schemaType)
    }

    const mapped = typesMap.get(schemaType.type?.name || '')
    if (mapped) {
      return mapped
    }

    if (schemaType.type && typesMap.has(schemaType.type.name)) {
      return typesMap.get(schemaType.type.name)!
    }

    // Cross dataset references are not supported
    if (isCrossDatasetReferenceType(schemaType)) {
      return {type: 'unknown'} satisfies SchemaUnknownNode // we don't support cross-dataset references at the moment
    }

    if (isReferenceType(schemaType)) {
      return createReferenceNodeDefintion(schemaType)
    }

    if (isArrayType(schemaType)) {
      return createArray(schemaType)
    }

    if (isObjectType(schemaType)) {
      return createObject(schemaType)
    }

    throw new Error(`Type "${schemaType.name}" not found`)
  }

  function createUnionNodeOptions(
    schemaType: ArraySchemaType,
    of: SchemaUnionOption<SchemaNode>[],
  ): SchemaUnionNodeOptions | undefined {
    const {options} = schemaType
    if (!options) return undefined
    const opts = {
      ...options,
    }
    if (options.insertMenu) {
      opts.insertMenu = {
        ...options.insertMenu,
        views: (options.insertMenu as InsertMenuOptions).views?.map((view) =>
          view.name === 'grid'
            ? {
                name: 'grid',
                previewImageUrls: view.previewImageUrl
                  ? of.reduce(
                      (acc, {name}) => {
                        const url = view.previewImageUrl?.(name)
                        if (!url) return acc
                        // If the URL is relative, make it absolute
                        try {
                          // eslint-disable-next-line no-new
                          new URL(url)
                          acc[name] = url
                        } catch {
                          acc[name] = new URL(
                            url,
                            `${window.location.origin}${basePath ? `${basePath}/` : ''}`,
                          ).toString()
                        }
                        return acc
                      },
                      {} as Record<string, string | undefined>,
                    )
                  : undefined,
              }
            : view,
        ),
      }
    }
    return opts
  }

  function createArray(
    arraySchemaType: ArraySchemaType,
  ): SchemaArrayNode | SchemaUnionNode | SchemaNullNode {
    const of: SchemaUnionOption[] = []
    for (const item of arraySchemaType.of) {
      let field = convertSchemaType(item)
      const option = {
        type: 'unionOption',
        icon: extractIcon(item),
        name: item.name,
        title: typeof item.title === 'string' ? item.title : undefined,
        value: field,
      } satisfies SchemaUnionOption
      if (field.type === 'inline') {
        field = {
          type: 'object',
          fields: {
            _key: createKeyField(),
          },
          rest: field,
        } satisfies SchemaObjectNode
      } else if (field.type === 'object') {
        field.rest = {
          type: 'object',
          fields: {
            _key: createKeyField(),
          },
        }
      }
      option.value = field
      of.push(option)
    }

    if (of.length === 0) {
      return {type: 'null'}
    }

    if (of.length > 1) {
      return {
        type: 'union',
        of,
        options: createUnionNodeOptions(arraySchemaType, of),
      }
    }

    const {name, title, value} = of[0]
    return {
      type: 'array',
      of: {
        type: 'arrayItem',
        name,
        title: typeof title === 'string' ? title : undefined,
        value,
      },
    }
  }
}

function createKeyField(): SchemaObjectField<SchemaStringNode> {
  return {
    type: 'objectField',
    name: '_key',
    value: {
      type: 'string',
    },
  }
}
