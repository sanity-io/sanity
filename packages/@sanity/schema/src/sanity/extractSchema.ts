import {
  type ArraySchemaType,
  type NumberSchemaType,
  type ObjectField,
  type ObjectFieldType,
  type ObjectSchemaType,
  type ReferenceSchemaType,
  type Rule,
  type Schema as SchemaDef,
  type SchemaType as SanitySchemaType,
  type StringSchemaType,
} from '@sanity/types'
import {
  type ArrayTypeNode,
  createReferenceTypeNode,
  type DocumentSchemaType,
  type InlineTypeNode,
  type NullTypeNode,
  type NumberTypeNode,
  type ObjectAttribute,
  type ObjectTypeNode,
  type SchemaType,
  type StringTypeNode,
  type TypeDeclarationSchemaType,
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

export interface ExtractSchemaOptions {
  enforceRequiredFields?: boolean
}

export function extractSchema(
  schemaDef: SchemaDef,
  extractOptions: ExtractSchemaOptions = {},
): SchemaType {
  const inlineFields = new Set<SanitySchemaType>()
  const documentTypes = new Map<string, DocumentSchemaType>()
  const schema: SchemaType = []

  // get a list of all the types in the schema, sorted by their dependencies. This ensures that when we check for inline/reference types, we have already processed the type
  const sortedSchemaTypeNames = sortByDependencies(schemaDef)
  sortedSchemaTypeNames.forEach((typeName) => {
    const schemaType = schemaDef.get(typeName)
    if (schemaType === undefined) {
      return
    }
    const base = convertBaseType(schemaType)
    if (base === null) {
      return
    }
    if (base.type === 'type') {
      inlineFields.add(schemaType)
    }
    if (base.type === 'document') {
      documentTypes.set(typeName, base)
    }

    schema.push(base)
  })

  function convertBaseType(
    schemaType: SanitySchemaType,
  ): DocumentSchemaType | TypeDeclarationSchemaType | null {
    let typeName: string | undefined
    if (schemaType.type) {
      typeName = schemaType.type.name
    } else if ('jsonType' in schemaType) {
      typeName = schemaType.jsonType
    }

    if (typeName === 'document' && isObjectType(schemaType)) {
      const defaultAttributes = documentDefaultFields(schemaType.name)

      const object = createObject(schemaType)
      if (object.type === 'unknown') {
        return null
      }

      return {
        name: schemaType.name,
        type: 'document',
        attributes: {
          ...defaultAttributes,
          ...object.attributes,
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
          attributes: {
            _type: {
              type: 'objectAttribute',
              value: {
                type: 'string',
                value: schemaType.name,
              },
            },
            ...value.attributes,
          },
        },
      }
    }

    return {
      name: schemaType.name,
      type: 'type',
      value,
    }
  }

  function convertSchemaType(schemaType: SanitySchemaType): TypeNode {
    // if we have already seen the base type, we can just reference it
    if (inlineFields.has(schemaType.type!)) {
      return {type: 'inline', name: schemaType.type!.name} satisfies InlineTypeNode
    }

    // If we have a type that is point to a type, that is pointing to a type, we assume this is a circular reference
    // and we return an inline type referencing it instead
    if (schemaType.type?.type?.name === 'object') {
      return {type: 'inline', name: schemaType.type.name} satisfies InlineTypeNode
    }

    if (isStringType(schemaType)) {
      return createStringTypeNodeDefintion(schemaType)
    }

    if (isNumberType(schemaType)) {
      return createNumberTypeNodeDefintion(schemaType)
    }

    // map some known types
    if (schemaType.type && typesMap.has(schemaType.type.name)) {
      return typesMap.get(schemaType.type.name)!
    }

    // Cross dataset references are not supported
    if (isCrossDatasetReferenceType(schemaType)) {
      return {type: 'unknown'} satisfies UnknownTypeNode // we don't support cross-dataset references at the moment
    }

    // Global document references are not supported
    if (isGlobalDocumentReferenceType(schemaType)) {
      return {type: 'unknown'} satisfies UnknownTypeNode // we don't support global document references at the moment
    }

    if (isReferenceType(schemaType)) {
      return createReferenceTypeNodeDefintion(schemaType)
    }

    if (isArrayType(schemaType)) {
      return createArray(schemaType)
    }

    if (isObjectType(schemaType)) {
      return createObject(schemaType)
    }

    if (lastType(schemaType)?.name === 'document') {
      const doc = documentTypes.get(schemaType.name)
      if (doc === undefined) {
        return {type: 'unknown'} satisfies UnknownTypeNode
      }
      return {type: 'object', attributes: doc?.attributes} satisfies ObjectTypeNode
    }

    throw new Error(`Type "${schemaType.name}" not found`)
  }

  function createObject(
    schemaType: ObjectSchemaType | SanitySchemaType,
  ): ObjectTypeNode | UnknownTypeNode {
    const attributes: Record<string, ObjectAttribute> = {}

    const fields = gatherFields(schemaType)
    for (const field of fields) {
      const fieldIsRequired = isFieldRequired(field)
      const value = convertSchemaType(field.type)
      if (value === null) {
        continue
      }

      // if the field sets assetRequired() we will mark the asset attribute as required
      // also guard against the case where the field is not an object, though type validation should catch this
      if (hasAssetRequired(field) && value.type === 'object') {
        value.attributes.asset.optional = false
      }

      // if we extract with enforceRequiredFields, we will mark the field as optional only if it is not a required field,
      // else we will always mark it as optional
      const optional = extractOptions.enforceRequiredFields ? fieldIsRequired === false : true

      attributes[field.name] = {
        type: 'objectAttribute',
        value,
        optional,
      }
    }

    // Ignore empty objects
    if (Object.keys(attributes).length === 0) {
      return {type: 'unknown'} satisfies UnknownTypeNode
    }

    if (schemaType.type?.name !== 'document' && schemaType.name !== 'object') {
      attributes._type = {
        type: 'objectAttribute',
        value: {
          type: 'string',
          value: schemaType.name,
        },
      }
    }

    return {
      type: 'object',
      attributes,
    }
  }

  function createArray(arraySchemaType: ArraySchemaType): ArrayTypeNode | NullTypeNode {
    const of: TypeNode[] = []
    for (const item of arraySchemaType.of) {
      const field = convertSchemaType(item)
      if (field.type === 'inline') {
        of.push({
          type: 'object',
          attributes: {
            _key: createKeyField(),
          },
          rest: field,
        } satisfies ObjectTypeNode)
      } else if (field.type === 'object') {
        field.rest = {
          type: 'object',
          attributes: {
            _key: createKeyField(),
          },
        }
        of.push(field)
      } else {
        of.push(field)
      }
    }

    if (of.length === 0) {
      return {type: 'null'}
    }

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

function isFieldRequired(field: ObjectField): boolean {
  const {validation} = field.type
  if (!validation) {
    return false
  }
  const rules = Array.isArray(validation) ? validation : [validation]
  for (const rule of rules) {
    let required = false

    // hack to check if a field is required. We create a proxy that returns itself when a method is called,
    // if the method is "required" we set a flag
    const proxy = new Proxy(
      {},
      {
        get: (target, methodName) => () => {
          if (methodName === 'required') {
            required = true
          }
          return proxy
        },
      },
    ) as Rule

    if (typeof rule === 'function') {
      rule(proxy)
      if (required) {
        return true
      }
    }

    if (typeof rule === 'object' && rule !== null && '_required' in rule) {
      if (rule._required === 'required') {
        return true
      }
    }
  }

  return false
}

function hasAssetRequired(field: ObjectField): boolean {
  const {validation} = field.type
  if (!validation) {
    return false
  }
  const rules = Array.isArray(validation) ? validation : [validation]
  for (const rule of rules) {
    let assetRequired = false

    // hack to check if a field is required. We create a proxy that returns itself when a method is called,
    // if the method is "required" we set a flag
    const proxy = new Proxy(
      {},
      {
        get: (target, methodName) => () => {
          if (methodName === 'assetRequired') {
            assetRequired = true
          }
          return proxy
        },
      },
    ) as Rule

    if (typeof rule === 'function') {
      rule(proxy)
      if (assetRequired) {
        return true
      }
    }

    if (
      typeof rule === 'object' &&
      rule !== null &&
      '_rules' in rule &&
      Array.isArray(rule._rules)
    ) {
      if (rule._rules.some((r) => r.flag === 'assetRequired')) {
        return true
      }
    }
  }

  return false
}

function isObjectType(typeDef: SanitySchemaType): typeDef is ObjectSchemaType {
  return isType(typeDef, 'object') || typeDef.jsonType === 'object' || 'fields' in typeDef
}
function isArrayType(typeDef: SanitySchemaType): typeDef is ArraySchemaType {
  return isType(typeDef, 'array')
}
function isReferenceType(typeDef: SanitySchemaType): typeDef is ReferenceSchemaType {
  return isType(typeDef, 'reference')
}
function isCrossDatasetReferenceType(typeDef: SanitySchemaType) {
  return isType(typeDef, 'crossDatasetReference')
}
function isGlobalDocumentReferenceType(typeDef: SanitySchemaType) {
  return isType(typeDef, 'globalDocumentReference')
}
function isStringType(typeDef: SanitySchemaType): typeDef is StringSchemaType {
  return isType(typeDef, 'string')
}
function isNumberType(typeDef: SanitySchemaType): typeDef is NumberSchemaType {
  return isType(typeDef, 'number')
}
function createStringTypeNodeDefintion(
  stringSchemaType: StringSchemaType,
): StringTypeNode | UnionTypeNode<StringTypeNode> {
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

function createNumberTypeNodeDefintion(
  numberSchemaType: NumberSchemaType,
): NumberTypeNode | UnionTypeNode<NumberTypeNode> {
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

function createReferenceTypeNodeDefintion(
  reference: ReferenceSchemaType,
): ObjectTypeNode | UnionTypeNode<ObjectTypeNode> {
  const references = gatherReferenceNames(reference)
  if (references.length === 1) {
    return createReferenceTypeNode(references[0])
  }

  return {
    type: 'union',
    of: references.map((name) => createReferenceTypeNode(name)),
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

// Traverse the type tree and gather all the fields
function gatherFields(type: SanitySchemaType | ObjectSchemaType): ObjectField[] {
  if ('fields' in type) {
    return type.type ? gatherFields(type.type).concat(type.fields) : type.fields
  }

  return []
}

// Traverse the type tree and check if the type or any of its subtypes are of the given type
function isType(
  typeDef: SanitySchemaType | ObjectField | ObjectFieldType,
  typeName: string,
): boolean {
  let type: SchemaType | ObjectField | ObjectFieldType | undefined = typeDef
  while (type) {
    if (type.name === typeName || (type.type && type.type.name === typeName)) {
      return true
    }

    type = type.type
  }
  return false
}

// Traverse the type tree and return the "last" type, ie deepest type in the tree
function lastType(typeDef: SanitySchemaType): SanitySchemaType | undefined {
  let type: SchemaType | ObjectField | ObjectFieldType | undefined = typeDef
  while (type) {
    if (!type.type) {
      return type
    }
    type = type.type
  }

  return undefined
}

// Sorts the types by their dependencies by using a topological sort depth-first algorithm.
function sortByDependencies(compiledSchema: SchemaDef): string[] {
  const seen = new Set<SanitySchemaType>()

  // Walks the dependencies of a schema type and adds them to the dependencies set
  function walkDependencies(
    schemaType: SanitySchemaType,
    dependencies: Set<SanitySchemaType>,
  ): void {
    if (seen.has(schemaType)) {
      return
    }
    seen.add(schemaType)

    if ('fields' in schemaType) {
      for (const field of gatherFields(schemaType)) {
        const last = lastType(field.type)
        if (last!.name === 'document') {
          dependencies.add(last!)
          continue
        }

        let schemaTypeName: string | undefined
        if (schemaType.type!.type) {
          schemaTypeName = field.type.type!.name
        } else if ('jsonType' in schemaType.type!) {
          schemaTypeName = field.type.jsonType
        }

        if (schemaTypeName === 'object' || schemaTypeName === 'block') {
          if (isReferenceType(field.type)) {
            field.type.to.forEach((ref) => dependencies.add(ref.type!))
          } else {
            dependencies.add(field.type)
          }
        }
        walkDependencies(field.type, dependencies)
      }
    } else if ('of' in schemaType) {
      for (const item of schemaType.of) {
        walkDependencies(item, dependencies)
      }
    }
  }
  const dependencyMap = new Map<SanitySchemaType, Set<SanitySchemaType>>()
  compiledSchema.getTypeNames().forEach((typeName) => {
    const schemaType = compiledSchema.get(typeName)
    if (schemaType === undefined || schemaType.type === null) {
      return
    }
    const dependencies = new Set<SanitySchemaType>()

    walkDependencies(schemaType, dependencies)
    dependencyMap.set(schemaType, dependencies)
    seen.clear() // Clear the seen set for the next type
  })

  // Sorts the types by their dependencies
  const typeNames: string[] = []
  // holds a temporary mark for types that are currently being visited, to detect cyclic dependencies
  const currentlyVisiting = new Set<SanitySchemaType>()

  // holds a permanent mark for types that have been already visited
  const visited = new Set<SanitySchemaType>()

  // visit implements a depth-first search
  function visit(type: SanitySchemaType) {
    if (visited.has(type)) {
      return
    }
    // If we find a type that is already in the temporary mark, we have a cyclic dependency.
    if (currentlyVisiting.has(type)) {
      return
    }
    // mark this as a temporary mark, meaning it's being visited
    currentlyVisiting.add(type)
    const deps = dependencyMap.get(type)
    if (deps !== undefined) {
      deps.forEach((dep) => visit(dep))
    }
    currentlyVisiting.delete(type)
    visited.add(type)

    if (!typeNames.includes(type.name)) {
      typeNames.unshift(type.name)
    }
  }
  // Visit all types in the dependency map
  for (const [type] of dependencyMap) {
    visit(type)
  }

  return typeNames
}
