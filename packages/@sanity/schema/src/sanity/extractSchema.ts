import {
  type ArrayDefinition,
  type ArrayOfType,
  type BlockDefinition,
  type CrossDatasetReferenceDefinition,
  type DocumentDefinition,
  type FieldDefinition,
  type FileDefinition,
  type ImageDefinition,
  type NumberDefinition,
  type ObjectDefinition,
  type ReferenceDefinition,
  type SchemaTypeDefinition,
  type StringDefinition,
} from '@sanity/types'
import {
  type ArrayTypeNode,
  createReferenceTypeNode,
  type InlineTypeNode,
  type NumberTypeNode,
  type ObjectAttribute,
  type ObjectTypeNode,
  type PrimitiveTypeNode,
  type SchemaType,
  type StringTypeNode,
  type TypeNode,
  type UnionTypeNode,
  type UnknownTypeNode,
} from 'groq-js'

const documentDefaultFields = (typeName: string): Record<string, ObjectAttribute> => ({
  _id: {
    type: 'objectAttribute',
    value: {type: 'string'},
  },
  _type: {
    type: 'objectAttribute',
    value: {type: 'string', value: typeName},
  },
  _createdAt: {
    type: 'objectAttribute',
    value: {type: 'string'},
  },
  _updatedAt: {
    type: 'objectAttribute',
    value: {type: 'string'},
  },
  _rev: {
    type: 'objectAttribute',
    value: {type: 'string'},
  },
})
const typesMap = new Map<string, TypeNode>([
  ['text', {type: 'string'}],
  ['url', {type: 'string'}],
  ['datetime', {type: 'string'}],
  ['date', {type: 'string'}],
  ['boolean', {type: 'boolean'}],
  ['email', {type: 'string'}],
])

export function extractSchema(schemaTypeDefinitions: SchemaTypeDefinition[]): SchemaType {
  const schema: SchemaType = []
  schemaTypeDefinitions.forEach((type) => {
    if (isDocumentType(type)) {
      const attributes = documentDefaultFields(type.name) satisfies Record<string, ObjectAttribute>

      for (const field of type.fields || []) {
        attributes[field.name] = {
          type: 'objectAttribute',
          optional: true,
          value: parseField(field),
        } satisfies ObjectAttribute
      }

      schema.push({
        name: type.name,
        type: 'document',
        attributes,
      })
      return
    }

    if (isObjectType(type)) {
      const attributes = type.fields.reduce<Record<string, ObjectAttribute>>((acc, field) => {
        acc[field.name] = {
          type: 'objectAttribute',
          optional: true,
          value: parseField(field),
        } satisfies ObjectAttribute

        return acc
      }, {}) satisfies Record<string, ObjectAttribute>

      attributes._type = {
        type: 'objectAttribute',
        value: {
          type: 'string',
          value: type.name,
        },
      } satisfies ObjectAttribute<StringTypeNode>

      schema.push({
        name: type.name,
        type: 'type',
        value: {
          type: 'object',
          attributes,
        },
      })
      return
    }
    if (isArrayType(type)) {
      schema.push({
        type: 'type',
        name: type.name,
        value: createArray(type),
      })
      return
    }

    if (isBlockType(type)) {
      schema.push({
        type: 'type',
        name: type.name,
        value: createBlock(type),
      })
      return
    }
    if (isImageType(type)) {
      schema.push({
        type: 'type',
        name: type.name,
        value: createImage(type),
      })
      return
    }
    if (isFileType(type)) {
      schema.push({
        type: 'type',
        name: type.name,
        value: createFile(type),
      })
      return
    }

    if (isReferenceType(type)) {
      schema.push({
        type: 'type',
        name: type.name,
        value: createReferenceTypeNodeDefintion(type),
      })
      return
    }

    if (isCrossDatasetReferenceType(type)) {
      schema.push({
        type: 'type',
        name: type.name,
        value: createCrossDatasetReferenceTypeNodeDefintion(type),
      })
      return
    }

    if (isStringType(type)) {
      schema.push({
        type: 'type',
        name: type.name,
        value: createStringTypeNodeDefintion(type),
      })
    }

    if (isNumberType(type)) {
      schema.push({
        type: 'type',
        name: type.name,
        value: createNumberTypeNodeDefintion(type),
      })
    }

    if (typesMap.has(type.type)) {
      schema.push({
        type: 'type',
        name: type.name,
        value: typesMap.get(type.type),
      })
      return
    }

    schema.push({
      type: 'type',
      name: type.name,
      value: {
        type: 'inline',
        name: type.type,
      } satisfies InlineTypeNode,
    })
  })

  return schema
}

function createKeyField(): ObjectAttribute<StringTypeNode> {
  return {
    type: 'objectAttribute',
    value: {
      type: 'string',
    },
  }
}

function parseField(field: FieldDefinition): TypeNode {
  if (isObjectType(field)) {
    const attributes: Record<string, ObjectAttribute> = {}
    field.fields.forEach((f) => {
      attributes[f.name] = {
        type: 'objectAttribute',
        value: parseField(f),
        optional: true,
      }
    })
    attributes._type = {
      type: 'objectAttribute',
      value: {
        type: 'string',
        value: field.name,
      },
    } satisfies ObjectAttribute<StringTypeNode>

    return {
      type: field.type,
      attributes,
    }
  }

  if (isArrayType(field)) {
    return createArray(field)
  }

  if (isBlockType(field)) {
    return createBlock(field)
  }
  if (isImageType(field)) {
    return createImage(field)
  }
  if (isFileType(field)) {
    return createFile(field)
  }

  if (isReferenceType(field)) {
    return createReferenceTypeNodeDefintion(field)
  }

  if (isCrossDatasetReferenceType(field)) {
    return createCrossDatasetReferenceTypeNodeDefintion(field)
  }

  if (isStringType(field)) {
    return createStringTypeNodeDefintion(field)
  }

  if (isNumberType(field)) {
    return createNumberTypeNodeDefintion(field)
  }

  if (typesMap.has(field.type)) {
    return typesMap.get(field.type)
  }

  return {
    type: 'inline',
    name: field.type,
  }
}

function isDocumentType(n: SchemaTypeDefinition): n is DocumentDefinition {
  return n.type === 'document'
}
function isFieldDefinition(n: unknown): n is FieldDefinition {
  return (
    n !== null &&
    typeof n === 'object' &&
    'type' in n &&
    (('fieldset' in n && typeof n.fieldset === 'string') ||
      !('fieldset' in n) ||
      typeof n.fieldset === 'undefined') &&
    (('group' in n && (typeof n.group === 'string' || Array.isArray(n.group))) ||
      !('group' in n) ||
      typeof n.group === 'undefined')
  )
}

function isObjectType(n: {type: string}): n is ObjectDefinition {
  return n.type === 'object'
}
function isArrayType(n: {type: string}): n is ArrayDefinition {
  return n.type === 'array'
}
function isBlockType(n: {type: string}): n is BlockDefinition {
  return n.type === 'block'
}
function isReferenceType(n: {type: string}): n is ReferenceDefinition {
  return n.type === 'reference'
}
function isCrossDatasetReferenceType(n: {type: string}): n is CrossDatasetReferenceDefinition {
  return n.type === 'crossDatasetReference'
}
function isImageType(n: {type: string}): n is ImageDefinition {
  return n.type === 'image'
}
function isFileType(n: {type: string}): n is FileDefinition {
  return n.type === 'file'
}
function isStringType(n: {type: string}): n is StringDefinition {
  return n.type === 'string'
}
function isNumberType(n: {type: string}): n is NumberDefinition {
  return n.type === 'number'
}

function createPrimitiveAttribute(
  key: string,
  type: PrimitiveTypeNode['type'],
  optional = false,
): Record<string, ObjectAttribute<PrimitiveTypeNode>> {
  return {
    [key]: {
      type: 'objectAttribute',
      value: {type},
      optional,
    },
  }
}

function createStringTypeNodeDefintion(
  stringDefinition: StringDefinition,
): StringTypeNode | UnionTypeNode<StringTypeNode> {
  if (stringDefinition.options?.list) {
    return {
      type: 'union',
      of: stringDefinition.options.list.map((v) => ({
        type: 'string',
        value: typeof v === 'string' ? v : v.value,
      })),
    }
  }
  return {
    type: 'string',
  }
}

function createNumberTypeNodeDefintion(
  numberDefinition: NumberDefinition,
): NumberTypeNode | UnionTypeNode<NumberTypeNode> {
  if (numberDefinition.options?.list) {
    return {
      type: 'union',
      of: numberDefinition.options.list.map((v) => ({
        type: 'number',
        value: typeof v === 'number' ? v : v.value,
      })),
    }
  }
  return {
    type: 'number',
  }
}

function createImage(imageDefinition: ImageDefinition): ObjectTypeNode {
  const attributes: Record<string, ObjectAttribute> = {}
  for (const field of imageDefinition.fields || []) {
    attributes[field.name] = {
      type: 'objectAttribute',
      value: parseField(field),
      optional: true,
    }
  }

  if (imageDefinition.options?.hotspot) {
    attributes.hotspot = {
      type: 'objectAttribute',
      value: {
        type: 'object',
        attributes: {
          _type: {
            type: 'objectAttribute',
            value: {
              type: 'string',
              value: 'sanity.imageHotspot',
            },
          },
          ...createPrimitiveAttribute('x', 'number'),
          ...createPrimitiveAttribute('y', 'number'),
          ...createPrimitiveAttribute('height', 'number'),
          ...createPrimitiveAttribute('width', 'number'),
        },
      },
      optional: true,
    }
    attributes.crop = {
      type: 'objectAttribute',
      value: {
        type: 'object',
        attributes: {
          _type: {
            type: 'objectAttribute',
            value: {
              type: 'string',
              value: 'sanity.imageCrop',
            },
          },
          ...createPrimitiveAttribute('top', 'number'),
          ...createPrimitiveAttribute('bottom', 'number'),
          ...createPrimitiveAttribute('left', 'number'),
          ...createPrimitiveAttribute('right', 'number'),
        },
      },
      optional: true,
    }
  }
  return {
    type: 'object',
    attributes: {
      _type: {
        type: 'objectAttribute',
        value: {
          type: 'string',
          value: 'image',
        },
      },
      asset: {
        type: 'objectAttribute',
        value: createReferenceTypeNode('sanity.imageAsset'),
      },
      ...attributes,
    },
  }
}
function createFile(fileDefinition: FileDefinition): ObjectTypeNode {
  const attributes: Record<string, ObjectAttribute> = {}
  for (const field of fileDefinition.fields || []) {
    attributes[field.name] = {
      type: 'objectAttribute',
      value: parseField(field),
      optional: true,
    }
  }

  return {
    type: 'object',
    attributes: {
      _type: {
        type: 'objectAttribute',
        value: {
          type: 'string',
          value: 'file',
        },
      },
      ...attributes,
    },
  }
}

function createArray(arrayDefinition: ArrayDefinition): ArrayTypeNode {
  const of = [
    ...arrayDefinition.of.map((f) => {
      if (isFieldDefinition(f)) {
        const field = parseField(f)
        if (field.type === 'inline') {
          return {
            type: 'object',
            attributes: {
              _key: createKeyField(),
            },
            rest: field,
          } satisfies ObjectTypeNode
        }

        if (field.type === 'object') {
          field.rest = {
            type: 'object',
            attributes: {
              _key: createKeyField(),
            },
          }
          return field
        }

        return field
      }

      if (typesMap.has(f.type)) {
        return typesMap.get(f.type)
      }

      return createReferenceTypeNode(f.type, true)
    }),
  ] satisfies TypeNode[]

  return {
    type: 'array',
    of:
      of.length > 1
        ? {
            type: 'union',
            of,
          }
        : of[0],
  }
}

function createBlock(blockDefinition: BlockDefinition): ObjectTypeNode {
  const styleField = {
    type: 'objectAttribute',
    optional: true,
    value: {
      type: 'union',
      of:
        blockDefinition.styles?.map((style) => ({
          type: 'string',
          value: style.value,
        })) || [],
    },
  } satisfies ObjectAttribute<UnionTypeNode<StringTypeNode>>
  const listItemField = {
    type: 'objectAttribute',
    optional: true,
    value: {
      type: 'union',
      of:
        blockDefinition.lists?.map((list) => ({
          type: 'string',
          value: list.value,
        })) || [],
    },
  } satisfies ObjectAttribute<UnionTypeNode<StringTypeNode>>
  const levelField = {
    type: 'objectAttribute',
    optional: true,
    value: {
      type: 'number',
    },
  } satisfies ObjectAttribute<NumberTypeNode>
  const marks: TypeNode[] = [
    {type: 'string'},
    ...(blockDefinition.marks?.decorators?.map(
      (mark): TypeNode => ({
        type: 'string',
        value: mark.value,
      }),
    ) || []),
  ]
  const childrenField = {
    type: 'objectAttribute',
    value: {
      type: 'array',
      of: {
        type: 'union',
        of: [
          {
            type: 'object',
            attributes: {
              _key: createKeyField(),
              text: {
                type: 'objectAttribute',
                value: {
                  type: 'string',
                },
              } satisfies ObjectAttribute<StringTypeNode>,
              marks: {
                type: 'objectAttribute',
                value: {
                  type: 'array',
                  of: {
                    type: 'union',
                    of: marks,
                  },
                },
              } satisfies ObjectAttribute<ArrayTypeNode<UnionTypeNode>>,
            },
          } satisfies ObjectTypeNode,
        ],
      } satisfies UnionTypeNode<ObjectTypeNode>,
    },
  } satisfies ObjectAttribute<ArrayTypeNode<UnionTypeNode<ObjectTypeNode>>>

  const markDefsField: ObjectAttribute<ArrayTypeNode> = {
    type: 'objectAttribute',
    value: {
      type: 'array',
      of: {
        type: 'union',
        of:
          blockDefinition.marks?.annotations?.map((annotation) => createMarkDefField(annotation)) ||
          [],
      },
    },
  }
  return {
    type: 'object',
    attributes: {
      _key: createKeyField(),
      level: levelField,
      style: styleField,
      listItem: listItemField,
      children: childrenField,
      markDefs: markDefsField,
    },
  }
}

function createMarkDefField(annotation: ArrayOfType<'object' | 'reference'>): TypeNode {
  if (annotation.type === 'object' && 'fields' in annotation) {
    const attributes: Record<string, ObjectAttribute> = {}
    for (const field of annotation.fields) {
      attributes[field.name] = {
        type: 'objectAttribute',
        value: parseField(field),
        optional: true,
      } satisfies ObjectAttribute
    }

    return {
      type: 'object',
      attributes,
    }
  }

  if (annotation.type === 'reference' && 'to' in annotation) {
    return createReferenceTypeNodeDefintion(annotation)
  }

  return {
    type: 'object',
    attributes: {},
  }
}

function createReferenceTypeNodeDefintion(
  reference: Pick<ReferenceDefinition, 'to'>,
): ObjectTypeNode | UnionTypeNode<ObjectTypeNode> {
  if (Array.isArray(reference.to)) {
    return {
      type: 'union',
      of: reference.to.map((t) => createReferenceTypeNode(t.type)),
    }
  }
  return createReferenceTypeNode(reference.to.type)
}
function createCrossDatasetReferenceTypeNodeDefintion(
  _: CrossDatasetReferenceDefinition,
): TypeNode {
  return {type: 'unknown'} satisfies UnknownTypeNode
}
