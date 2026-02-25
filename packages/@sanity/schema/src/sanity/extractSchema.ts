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
  type SchemaValidationValue,
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

/**
 * Extracts a GROQ-compatible schema from a Sanity schema definition. The extraction happens in three passes:
 *
 * 1. **Dependency analysis & hoisting detection** (`sortByDependencies`): Walks the entire schema to sort
 *    types topologically and identifies inline object fields that are used multiple times (candidates
 *    for "hoisting").
 *
 * 2. **Hoisted type creation**: For any repeated inline fields, we create top-level named type definitions
 *    first, so they exist before being referenced.
 *
 * 3. **Main type conversion**: Processes each schema type in dependency order. When a field was marked for
 *    hoisting, we emit an `inline` reference to the hoisted type instead of duplicating the structure.
 */
export function extractSchema(
  schemaDef: SchemaDef,
  extractOptions: ExtractSchemaOptions = {},
): SchemaType {
  const inlineFields = new Set<SanitySchemaType>()
  const documentTypes = new Map<string, DocumentSchemaType>()
  const schema: SchemaType = []

  /**
   * A map for keeping track of the unique names we generate for hoisted references
   */
  const hoistedRefMap = new Map<string, string>()

  // `repeated` maps ObjectField instances → hoisted type names. When the same inline type (e.g., `blocksTest`)
  // is used in multiple documents, Sanity's compiled schema reuses the same ObjectField object reference. This
  // allows us to detect repetition via object identity, not structural comparison.
  const {sortedSchemaTypeNames, repeated} = sortByDependencies(schemaDef)

  // Create top-level type definitions for hoisted (repeated) inline types. These must be added to the schema
  // before we process the main types, so that inline references to them can resolve correctly.
  repeated.forEach((key, objectField) => {
    const base = convertSchemaType(objectField.type)
    if (base === null) {
      return
    }
    // Skip creating hoisted types that would just be inline references to existing types.
    // Remove from `repeated` so the field falls through to convertSchemaType in createObject.
    if (base.type === 'inline') {
      repeated.delete(objectField)
      return
    }
    // Skip creating hoisted types for unknown types - there's no point hoisting types we don't understand.
    // Remove from `repeated` so the field falls through to convertSchemaType in createObject.
    if (base.type === 'unknown') {
      repeated.delete(objectField)
      return
    }
    schema.push({
      type: 'type',
      name: key,
      value: base,
    })
  })
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

  /**
   * Get unique schema name for a type name. It checks for collisions with names from the user defined
   * types and allows specifying a suffix to add to the name of the type
   *
   * @param refName - the ref name to get unique name for
   */
  function reserveRefName(refName: string) {
    const name = hoistedRefMap.get(refName)
    if (name) return name

    for (let i = 0; i < 5; i++) {
      const uniqueName = `${refName}${i || ''}`

      // if the list of schema types contain the uniqueName we need to try the next prefix
      if (schemaDef.has(uniqueName)) continue

      // the type name is unique
      hoistedRefMap.set(refName, uniqueName)
      return uniqueName
    }

    return null
  }

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
      value.attributes = {
        _type: {
          type: 'objectAttribute',
          value: {
            type: 'string',
            value: schemaType.name,
          },
        },
        ...value.attributes,
      }
      return {
        name: schemaType.name,
        type: 'type',
        value,
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

    if (schemaType.type?.name && sortedSchemaTypeNames.indexOf(schemaType.type?.name) > -1) {
      const isDocType = lastType(schemaType.type)?.name === 'document'

      /**
       * If the referenced type is a type that is not a top level document type, we reference
       * it with an inline type. If it's a document type we let it flow through through to be
       * embedded in the output. Less optimal output, but one that is supported by the groq-js
       * and codegen tooling.
       */
      if (!isDocType) {
        return {type: 'inline', name: schemaType.type?.name} satisfies InlineTypeNode
      }
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
      const fieldIsRequired = isFieldRequired(field?.type?.validation)
      let value: TypeNode

      const hoisted = repeated.get(field)
      const isTopLevelSchemaType = sortedSchemaTypeNames.includes(field.type.name)

      // Check if this field should use a hoisted type reference instead of inlining. We only hoist if:
      // - The field is in the `repeated` map (used more than once) AND
      // - The field's type is NOT a top-level schema type (those are already named)
      if (hoisted && !isTopLevelSchemaType) {
        // This field is hoisted, hoist it with an inline type
        value = {
          type: 'inline',
          name: hoisted,
        }
      } else {
        value = convertSchemaType(field.type)
        if (value === null) {
          continue
        }

        // if the field sets assetRequired() we will mark the asset attribute as required
        // also guard against the case where the field is not an object, though type validation should catch this
        if (hasAssetRequired(field?.type?.validation) && value.type === 'object') {
          value.attributes.asset.optional = false
        }
      }

      // if we extract with enforceRequiredFields, we will mark the field as optional only if it is not a required field,
      // else we will always mark it as optional
      const optional = extractOptions.enforceRequiredFields ? !fieldIsRequired : true

      attributes[field.name] = {
        type: 'objectAttribute',
        value,
        optional,
      }
    }

    // If we enforce required fields and the schema type itself (not just its fields) has assetRequired validation
    // we set asset.optional=false. This handles cases like array members with validation: (rule) => rule.assetRequired()
    if (
      extractOptions.enforceRequiredFields &&
      hasAssetRequired(schemaType.validation) &&
      attributes.asset
    ) {
      attributes.asset.optional = false
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

  function createReferenceTypeNodeDefintion(
    reference: ReferenceSchemaType,
  ): ObjectTypeNode | InlineTypeNode | UnionTypeNode<InlineTypeNode | ObjectTypeNode> {
    const references = gatherReferenceNames(reference)

    // Ensure hoisted reference types exist for each referenced document type
    for (const name of references) {
      const refName = getInlineRefName(name)
      if (!hoistedRefMap.has(refName)) {
        const inlined = reserveRefName(refName)
        if (inlined) {
          schema.push({
            type: 'type',
            name: inlined,
            value: createReferenceTypeNode(name),
          })
        }
      }
    }

    if (references.length === 1) {
      const inlined = hoistedRefMap.get(getInlineRefName(references[0]))
      if (inlined) {
        return {type: 'inline', name: inlined}
      }
      return createReferenceTypeNode(references[0])
    }

    return {
      type: 'union',
      of: references.map((name) => {
        const inlined = hoistedRefMap.get(getInlineRefName(name))
        if (inlined) {
          return {type: 'inline', name: inlined}
        }
        return createReferenceTypeNode(name)
      }),
    }
  }

  return schema
}

function getInlineRefName(typeName: string) {
  return `${typeName}.reference`
}

function createKeyField(): ObjectAttribute<StringTypeNode> {
  return {
    type: 'objectAttribute',
    value: {
      type: 'string',
    },
  }
}

function isFieldRequired(validation?: SchemaValidationValue): boolean {
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

function hasAssetRequired(validation?: SchemaValidationValue): boolean {
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

// Traverse the reference type tree and gather all the reference names
function gatherReferenceNames(type: ReferenceSchemaType): string[] {
  const allReferences = gatherReferenceTypes(type)
  // Remove duplicates
  return [...new Set(allReferences.map((ref) => ref.name))]
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

/**
 * Sorts schema types topologically by their dependencies using depth-first traversal.
 *
 * Also detects "repeated" inline object fields - fields that appear in multiple places in the schema. These
 * are candidates for hoisting to avoid duplication in the output.
 *
 * @returns
 * - `sortedSchemaTypeNames`: Type names in dependency order (dependencies come first)
 * - `repeated`: Map from ObjectField → generated hoisted type name (e.g., "blocks.content")
 *
 * Detection relies on object identity: Sanity's compiled schema reuses the same ObjectField instance when an
 * inline type is referenced multiple times.
 */
function sortByDependencies(compiledSchema: SchemaDef): {
  sortedSchemaTypeNames: string[]
  repeated: Map<ObjectField, string>
} {
  const seen = new Set<SanitySchemaType>()
  const objectMap = new Set<ObjectField>()
  const repeated = new Map<ObjectField, string>()
  const repeatedNames = new Set<string>()

  /**
   * Generates a unique name for a hoisted type based on its field path.
   * Tries shortest suffix first (e.g., "content"), then progressively longer
   * paths (e.g., "blocks.content", "post.blocks.content") until finding a unique name.
   */
  function pickRepeatedName(path: string[]): string | null {
    for (let idx = path.length - 1; idx >= 1; idx--) {
      const name = path.slice(idx).join('.')
      if (!repeatedNames.has(name) && !compiledSchema.get(name)) {
        repeatedNames.add(name)
        return name
      }
    }
    for (let i = 1; i < 10; i++) {
      for (let idx = path.length - 1; idx >= 1; idx--) {
        const name = `${path.slice(idx).join('.')}${i}`
        if (!repeatedNames.has(name) && !compiledSchema.get(name)) {
          repeatedNames.add(name)
          return name
        }
      }
    }
    return null
  }

  // Walks the dependencies of a schema type and adds them to the dependencies set
  function walkDependencies(
    schemaType: SanitySchemaType,
    dependencies: Set<SanitySchemaType>,
    path: string[],
    hoistRepetitions = true,
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
            // Reference types are handled by createReferenceTypeNodeDefintion - add their targets as dependencies
            // but skip hoisting detection since references have their own hoisting mechanism
            field.type.to.forEach((ref) => dependencies.add(ref.type!))
          } else {
            dependencies.add(field.type)

            // Hoisting detection: Only consider inline types (not in compiledSchema). If we've seen this exact
            // ObjectField before, it's used in multiple places and should be hoisted to a named type to avoid
            // duplication.
            if (hoistRepetitions && !validSchemaNames.has(field.type.name)) {
              const fieldPath = path.concat([field.name])
              // eslint-disable-next-line max-depth
              if (!repeated.has(field) && objectMap.has(field)) {
                // The field is not in the repeated set, but it's the second time we see it – time to add it
                const name = pickRepeatedName(fieldPath)

                // If we couldn't pick a name, we skip hoisting for this field
                // eslint-disable-next-line max-depth
                if (name !== null) {
                  repeated.set(field, name)
                }
              }

              // Track all inline object fields we encounter
              objectMap.add(field)
            }
          }
        } else if (field.type) {
          dependencies.add(field.type)
        }
        walkDependencies(field.type, dependencies, path.concat([field.name]))
      }
    } else if ('of' in schemaType) {
      for (const item of schemaType.of) {
        walkDependencies(item, dependencies, path.concat(item.name), !isReferenceType(schemaType))
      }
    }
  }
  const dependencyMap = new Map<SanitySchemaType, Set<SanitySchemaType>>()
  const schemaTypeNames = compiledSchema.getTypeNames()
  const validSchemaNames = new Set<string>()
  schemaTypeNames.forEach((typeName) => {
    const schemaType = compiledSchema.get(typeName)
    if (schemaType === undefined || schemaType.type === null) {
      return
    }
    validSchemaNames.add(typeName)
    const dependencies = new Set<SanitySchemaType>()

    walkDependencies(schemaType, dependencies, [typeName])
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

    if (typeNames.includes(type.name)) {
      typeNames.splice(typeNames.indexOf(type.name), 1)
    }
    typeNames.unshift(type.name)
  }
  // Visit all types in the dependency map
  for (const [type] of dependencyMap) {
    visit(type)
  }

  return {
    sortedSchemaTypeNames: typeNames.filter((typeName) => validSchemaNames.has(typeName)),
    repeated,
  }
}
