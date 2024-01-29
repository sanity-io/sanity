import {
  type ArrayDefinition,
  type ArrayOfType,
  type BlockDefinition,
  type CrossDatasetReferenceDefinition,
  type DocumentDefinition,
  type FieldDefinition,
  type FileDefinition,
  type ImageDefinition,
  type ObjectDefinition,
  type ReferenceDefinition,
  type SchemaTypeDefinition,
} from '@sanity/types'
import {
  type ArrayTypeNode,
  type NumberTypeNode,
  type ObjectKeyValue,
  type ObjectTypeNode,
  type OptionalTypeNode,
  type PrimitiveTypeNode,
  type ReferenceTypeNode,
  type Schema,
  type StringTypeNode,
  type TypeNode,
  type UnionTypeNode,
  type UnknownTypeNode,
} from 'groq-js/typeEvaluator'

const defaultFields = (typeName: string): Array<ObjectKeyValue> => [
  {
    type: 'objectKeyValue',
    key: '_id',
    value: {type: 'string'},
  },
  {
    type: 'objectKeyValue',
    key: '_type',
    value: {type: 'string', value: typeName},
  },
  {
    type: 'objectKeyValue',
    key: '_createdAt',
    value: {type: 'string'},
  },
  {
    type: 'objectKeyValue',
    key: '_updatedAt',
    value: {type: 'string'},
  },
  {
    type: 'objectKeyValue',
    key: '_rev',
    value: {type: 'string'},
  },
]
const typesMap = new Map<string, TypeNode>([
  ['string', {type: 'string'}],
  ['text', {type: 'string'}],
  ['url', {type: 'string'}],
  ['datetime', {type: 'string'}],
  ['date', {type: 'string'}],
  ['number', {type: 'number'}],
  ['boolean', {type: 'boolean'}],
  ['email', {type: 'string'}],
])

export function extractSchema(schemaTypeDefinitions: SchemaTypeDefinition[]): Schema {
  const schema: Schema = []
  schemaTypeDefinitions.forEach((type) => {
    if (isDocumentType(type)) {
      const fields: ObjectKeyValue[] = [
        ...defaultFields(type.name),
        ...type.fields.map(
          (field) =>
            ({
              type: 'objectKeyValue',
              key: field.name,
              value: optionalTypeNode(parseField(field)),
            }) satisfies ObjectKeyValue,
        ),
      ]
      schema.push({
        name: type.name,
        type: 'document',
        fields,
      })
      return
    }

    if (isObjectType(type)) {
      const fields: ObjectKeyValue[] = type.fields.map(
        (field) =>
          ({
            type: 'objectKeyValue',
            key: field.name,
            value: optionalTypeNode(parseField(field)),
          }) satisfies ObjectKeyValue,
      )

      fields.push({
        type: 'objectKeyValue',
        key: '_type',
        value: {
          type: 'string',
          value: type.name,
        },
      } as ObjectKeyValue<StringTypeNode>)

      // Add _key field, it's optional and only available when used in an array
      // todo: add support for _key in object properly on references inside an array. Also for documents
      fields.push({
        type: 'objectKeyValue',
        key: '_key',
        value: optionalTypeNode({
          type: 'string',
        }),
      } as ObjectKeyValue<OptionalTypeNode<StringTypeNode>>)

      schema.push({
        name: type.name,
        type: 'type',
        value: {
          type: 'object',
          fields,
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
        type: 'reference',
        to: type.type,
      } satisfies ReferenceTypeNode,
    })
  })

  return schema
}

function createKeyField(): ObjectKeyValue<OptionalTypeNode<StringTypeNode>> {
  return {
    type: 'objectKeyValue',
    key: '_key',
    value: optionalTypeNode({
      type: 'string',
    }),
  }
}

function optionalTypeNode<T extends TypeNode = TypeNode>(value: T): OptionalTypeNode<T> {
  return {
    type: 'optional',
    value: value,
  }
}
function parseField(field: FieldDefinition): TypeNode {
  if (isObjectType(field)) {
    const fields: ObjectKeyValue[] = []
    field.fields.forEach((f) => {
      fields.push({
        type: 'objectKeyValue',
        key: f.name,
        value: optionalTypeNode(parseField(f)),
      })
    })
    fields.push({
      type: 'objectKeyValue',
      key: '_type',
      value: {
        type: 'string',
        value: field.name,
      },
    } as ObjectKeyValue<StringTypeNode>)

    return {
      type: field.type,
      fields,
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

  if (typesMap.has(field.type)) {
    return typesMap.get(field.type)
  }

  return {
    type: 'reference',
    to: field.type,
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

function createPrimitiveTypeNode(
  key: string,
  type: PrimitiveTypeNode['type'],
  optional = false,
): ObjectKeyValue<PrimitiveTypeNode | OptionalTypeNode<PrimitiveTypeNode>> {
  return {
    type: 'objectKeyValue',
    key,
    value: optional ? optionalTypeNode({type}) : {type},
  }
}

function createImage(imageDefinition: ImageDefinition): ObjectTypeNode {
  const fields: ObjectKeyValue[] =
    imageDefinition.fields?.map((field) => ({
      type: 'objectKeyValue',
      key: field.name,
      value: optionalTypeNode(parseField(field)),
    })) || []

  if (imageDefinition.options?.hotspot) {
    fields.push({
      type: 'objectKeyValue',
      key: 'hotspot',
      value: optionalTypeNode({
        type: 'object',
        fields: [
          createPrimitiveTypeNode('x', 'number'),
          createPrimitiveTypeNode('y', 'number'),
          createPrimitiveTypeNode('height', 'number'),
          createPrimitiveTypeNode('width', 'number'),
        ],
      }),
    })
    fields.push({
      type: 'objectKeyValue',
      key: 'crop',
      value: optionalTypeNode({
        type: 'object',
        fields: [
          createPrimitiveTypeNode('top', 'number'),
          createPrimitiveTypeNode('bottom', 'number'),
          createPrimitiveTypeNode('left', 'number'),
          createPrimitiveTypeNode('right', 'number'),
        ],
      }),
    })
  }
  return {
    type: 'object',
    fields: [
      {
        type: 'objectKeyValue',
        key: '_type',
        value: {
          type: 'string',
          value: 'image',
        },
      },
      {
        type: 'objectKeyValue',
        key: 'asset',
        value: {
          type: 'reference',
          to: 'sanity.imageAsset',
        },
      },
      ...fields,
    ],
  }
}
function createFile(fileDefinition: FileDefinition): ObjectTypeNode {
  const fields: ObjectKeyValue[] =
    fileDefinition.fields?.map((field) => ({
      type: 'objectKeyValue',
      key: field.name,
      value: optionalTypeNode(parseField(field)),
    })) || []

  return {
    type: 'object',
    fields: [
      {
        type: 'objectKeyValue',
        key: '_type',
        value: {
          type: 'string',
          value: 'file',
        },
      },
      ...fields,
    ],
  }
}

function createArray(arrayDefinition: ArrayDefinition): ArrayTypeNode {
  const of: TypeNode[] = [
    ...arrayDefinition.of.map((f) => {
      if (isFieldDefinition(f)) {
        const field = parseField(f)
        if (field.type === 'object' || field.type === 'document') {
          field.fields.push(createKeyField())
        }

        return field
      }

      if (typesMap.has(f.type)) {
        return typesMap.get(f.type)
      }

      return {
        type: 'reference',
        to: f.type,
      } satisfies ReferenceTypeNode
    }),
  ]

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
    type: 'objectKeyValue',
    key: 'style',
    value: optionalTypeNode({
      type: 'union',
      of:
        blockDefinition.styles?.map((style) => ({
          type: 'string',
          value: style.value,
        })) || [],
    }),
  } satisfies ObjectKeyValue<OptionalTypeNode<UnionTypeNode<StringTypeNode>>>
  const listItemField = {
    type: 'objectKeyValue',
    key: 'listItem',
    value: optionalTypeNode({
      type: 'union',
      of:
        blockDefinition.lists?.map((list) => ({
          type: 'string',
          value: list.value,
        })) || [],
    }),
  } satisfies ObjectKeyValue<OptionalTypeNode<UnionTypeNode<StringTypeNode>>>
  const levelField = {
    type: 'objectKeyValue',
    key: 'level',
    value: {
      type: 'number',
    },
  } satisfies ObjectKeyValue<NumberTypeNode>
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
    type: 'objectKeyValue',
    key: 'children',
    value: optionalTypeNode({
      type: 'array',
      of: {
        type: 'union',
        of: [
          {
            type: 'object',
            fields: [
              createKeyField(),
              {
                type: 'objectKeyValue',
                key: 'text',
                value: optionalTypeNode({
                  type: 'string',
                }),
              } satisfies ObjectKeyValue<OptionalTypeNode<StringTypeNode>>,
              {
                type: 'objectKeyValue',
                key: 'marks',
                value: optionalTypeNode({
                  type: 'array',
                  of: {
                    type: 'union',
                    of: marks,
                  },
                }),
              } satisfies ObjectKeyValue<OptionalTypeNode<ArrayTypeNode<UnionTypeNode>>>,
            ],
          } satisfies ObjectTypeNode,
        ],
      } satisfies UnionTypeNode<ObjectTypeNode>,
    }),
  } satisfies ObjectKeyValue<OptionalTypeNode<ArrayTypeNode<UnionTypeNode<ObjectTypeNode>>>>

  const markDefsField: ObjectKeyValue<
    OptionalTypeNode<
      ArrayTypeNode<
        UnionTypeNode<ObjectTypeNode | ReferenceTypeNode | UnionTypeNode<ReferenceTypeNode>>
      >
    >
  > = {
    type: 'objectKeyValue',
    key: 'markDefs',
    value: optionalTypeNode({
      type: 'array',
      of: {
        type: 'union',
        of:
          blockDefinition.marks?.annotations?.map((annotation) => createMarkDefField(annotation)) ||
          [],
      },
    }),
  }
  return {
    type: 'object',
    fields: [levelField, styleField, listItemField, childrenField, markDefsField, createKeyField()],
  }
}

function createMarkDefField(
  annotation: ArrayOfType<'object' | 'reference'>,
): ObjectTypeNode | ReferenceTypeNode | UnionTypeNode<ReferenceTypeNode> {
  if (annotation.type === 'object' && 'fields' in annotation) {
    const fields: ObjectKeyValue[] = [
      createKeyField(),
      ...annotation.fields.map(
        (field): ObjectKeyValue => ({
          type: 'objectKeyValue',
          key: field.name,
          value: optionalTypeNode(parseField(field)),
        }),
      ),
    ]

    return {
      type: 'object',
      fields,
    }
  }

  if (annotation.type === 'reference' && 'to' in annotation) {
    return createReferenceTypeNodeDefintion(annotation)
  }

  return {
    type: 'object',
    fields: [],
  }
}

function createReferenceTypeNodeDefintion(
  reference: Pick<ReferenceDefinition, 'to'>,
): ReferenceTypeNode | UnionTypeNode<ReferenceTypeNode> {
  if (Array.isArray(reference.to)) {
    return {
      type: 'union',
      of: reference.to.map((t) => ({
        type: 'reference',
        to: t.type,
      })),
    }
  }
  return {
    type: 'reference',
    to: reference.to.type,
  } satisfies ReferenceTypeNode
}
function createCrossDatasetReferenceTypeNodeDefintion(
  _: CrossDatasetReferenceDefinition,
): TypeNode {
  return {type: 'unknown'} satisfies UnknownTypeNode
}
