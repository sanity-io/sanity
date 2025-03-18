import {generateHelpUrl} from '@sanity/generate-help-url'
import {Schema} from '@sanity/schema'
import {
  type ArraySchemaType,
  type CrossDatasetReferenceSchemaType,
  type IntrinsicTypeName,
  isDeprecationConfiguration,
  type ObjectField,
  type ObjectFieldType,
  type ObjectSchemaType,
  type ReferenceSchemaType,
  type Schema as CompiledSchema,
  type SchemaType,
} from '@sanity/types'
import {startCase, uniqBy} from 'lodash'
import oneline from 'oneline'

import * as helpUrls from './helpUrls'
import {SchemaError} from './SchemaError'
import {
  type ApiSpecification,
  type ConvertedFieldDefinition,
  type ConvertedInterface,
  type ConvertedType,
  type ConvertedUnion,
  type Deprecation,
} from './types'

const skipTypes = ['document', 'reference']
const allowedJsonTypes = ['object', 'array']
const disallowedCustomizedMembers = ['object', 'array', 'image', 'file', 'block']
const disabledBlockFields = ['markDefs']
const scalars = ['string', 'number', 'boolean']

/**
 * Data required elsewhere in the API specification generation process, but that should not be
 * included in the generated API specification.
 */
export const internal = Symbol('internal')

function getBaseType(baseSchema: CompiledSchema, typeName: IntrinsicTypeName): SchemaType {
  if (typeName === 'crossDatasetReference') {
    return Schema.compile({
      types: (baseSchema._original?.types || []).concat([
        {
          name: `__placeholder__`,
          type: 'crossDatasetReference',
          // Just needs _something_ to refer to, doesn't matter what
          to: [{type: 'sanity.imageAsset'}],
        },
      ]),
    }).get('__placeholder__')
  }
  if (typeName === 'globalDocumentReference') {
    return Schema.compile({
      types: (baseSchema._original?.types || []).concat([
        {
          name: `__placeholder__`,
          type: 'globalDocumentReference',
          // Just needs _something_ to refer to, doesn't matter what
          to: [{type: 'sanity.imageAsset'}],
        },
      ]),
    }).get('__placeholder__')
  }

  return Schema.compile({
    types: (baseSchema._original?.types || []).concat([
      {name: `__placeholder__`, type: typeName, options: {hotspot: true}},
    ]),
  }).get('__placeholder__')
}

function getTypeName(str: string): string {
  const name = startCase(str).replace(/\s+/g, '')
  return name === 'Number' ? 'Float' : name
}

function isBaseType(type: SchemaType): boolean {
  return (
    type.name !== type.jsonType &&
    allowedJsonTypes.includes(type.jsonType) &&
    !skipTypes.includes(type.name) &&
    !isReference(type)
  )
}

function isBlockType(typeDef: SchemaType | ObjectField): boolean {
  if (typeDef.name === 'block') {
    return true
  }

  if (typeDef.type) {
    return isBlockType(typeDef.type)
  }

  return false
}

function hasBlockParent(typeDef: SchemaType): boolean {
  if (typeDef.type && typeDef.type.name === 'block' && !typeDef.type.type) {
    return true
  }

  return Boolean(typeDef.type && hasBlockParent(typeDef.type))
}

function isArrayOfBlocks(typeDef: SchemaType | ObjectField): boolean {
  const type = typeDef.type || typeDef
  if (!('jsonType' in type) || type.jsonType !== 'array') {
    return false
  }

  return (type.of || []).some(hasBlockParent)
}

function isType(typeDef: SchemaType | ObjectField | ObjectFieldType, typeName: string): boolean {
  let type: SchemaType | ObjectField | ObjectFieldType | undefined = typeDef
  while (type) {
    if (type.name === typeName || (type.type && type.type.name === typeName)) {
      return true
    }

    type = type.type
  }
  return false
}

function isReference(
  typeDef: SchemaType | ObjectField | ObjectFieldType,
): typeDef is ReferenceSchemaType {
  return isType(typeDef, 'reference')
}

function isCrossDatasetReference(
  typeDef: SchemaType | ObjectField | ObjectFieldType | CrossDatasetReferenceSchemaType,
) {
  return isType(typeDef, 'crossDatasetReference')
}

function getCrossDatasetReferenceMetadata(
  typeDef: SchemaType | ObjectField | ObjectFieldType | CrossDatasetReferenceSchemaType,
) {
  if (!isCrossDatasetReference(typeDef)) return undefined

  function getTypeNames(
    type: SchemaType | ObjectField | ObjectFieldType | CrossDatasetReferenceSchemaType | undefined,
  ) {
    if (!type) return undefined
    if (!('to' in type)) return getTypeNames(type.type)
    return type.to.map((t) => t.type).filter((t): t is string => typeof t === 'string')
  }

  function getDataset(
    type: SchemaType | ObjectField | ObjectFieldType | CrossDatasetReferenceSchemaType | undefined,
  ) {
    if (!type) return undefined
    if ('dataset' in type && typeof type.dataset === 'string') return type.dataset
    if (type.type) return getDataset(type.type)
    return undefined
  }

  const typeNames = getTypeNames(typeDef)
  if (!typeNames) return undefined

  const dataset = getDataset(typeDef)
  if (typeof dataset !== 'string') return undefined

  return {typeNames, dataset}
}

export function extractFromSanitySchema(
  sanitySchema: CompiledSchema,
  extractOptions: {nonNullDocumentFields?: boolean; withUnionCache?: boolean} = {},
): ApiSpecification {
  const {nonNullDocumentFields, withUnionCache} = extractOptions
  const unionRecursionGuards = new Set<string>()
  const unionDefinitionCache = new Map<string, any>()
  const hasErrors =
    sanitySchema._validation &&
    sanitySchema._validation.some((group) =>
      group.problems.some((problem) => problem.severity === 'error'),
    )

  if (hasErrors && Array.isArray(sanitySchema._validation)) {
    throw new SchemaError(sanitySchema._validation)
  }

  const sanityTypes = sanitySchema._original?.types || []
  const typeNames = sanitySchema.getTypeNames()
  const unionTypes: ConvertedUnion[] = []
  const types: ConvertedType[] = []

  for (const typeName of typeNames) {
    const schemaType = sanitySchema.get(typeName)
    if (schemaType === undefined) {
      continue
    }
    if (!isBaseType(schemaType)) {
      continue
    }

    const convertedType = convertType(schemaType)
    types.push(convertedType)
  }

  const withUnions = [...types, ...unionTypes]
  return {types: withUnions, interfaces: [getDocumentInterfaceDefinition()]}

  function isTopLevelType(typeName: string): boolean {
    return typeNames.includes(typeName)
  }

  function mapFieldType(field: SchemaType | ObjectField | ObjectFieldType): string {
    if (!field.type) {
      throw new Error('Field has no type!')
    }

    const jsonType = 'jsonType' in field ? field.jsonType : ''
    const isScalar = scalars.includes(jsonType)
    if (isScalar && jsonType === 'number') {
      return hasValidationFlag(field, 'integer') ? 'Int' : 'Float'
    } else if (isScalar) {
      return getTypeName(jsonType)
    }

    const type = field.type.type || field.type

    // In the case of nested scalars, recurse (markdown -> longText -> text -> string)
    if (type.type) {
      return mapFieldType(type)
    }

    switch (type.name) {
      case 'number':
        return hasValidationFlag(field, 'integer') ? 'Int' : 'Float'
      default:
        return getTypeName(type.name)
    }
  }

  function isArrayType(type: SchemaType | ObjectField): type is ArraySchemaType {
    return Boolean(
      ('jsonType' in type && type.jsonType === 'array') ||
        (type.type && type.type.jsonType === 'array'),
    )
  }

  function _convertType(
    type: SchemaType | ObjectField,
    parent: string,
    options: {isField?: boolean},
  ): ConvertedType {
    let name: string | undefined
    if (type.type) {
      name = type.type.name
    } else if ('jsonType' in type) {
      name = type.jsonType
    }

    if (isReference(type)) {
      return getReferenceDefinition(type, parent)
    }

    if (isArrayType(type)) {
      return getArrayDefinition(type, parent, options)
    }

    if (name === 'document') {
      return getDocumentDefinition(type as ObjectSchemaType)
    }

    if (name === 'block' || name === 'object') {
      return getObjectDefinition(type, parent)
    }

    if (hasFields(type)) {
      return getObjectDefinition(type, parent)
    }

    return {
      type: mapFieldType(type),
      description: getDescription(type),
    } as any
  }

  function convertType(
    type: SchemaType | ObjectField,
    parent?: string,
    props: {fieldName?: string} & Partial<Deprecation> = {},
  ): ConvertedType {
    const mapped = _convertType(type, parent || '', {isField: Boolean(props.fieldName)})
    const gqlName = props.fieldName || mapped.name
    const originalName = type.name
    const original = gqlName === originalName ? {} : {originalName: originalName}
    const crossDatasetReferenceMetadata = getCrossDatasetReferenceMetadata(type)

    return {
      ...getDeprecation(type.type),
      ...props,
      ...mapped,
      ...original,
      ...(crossDatasetReferenceMetadata && {crossDatasetReferenceMetadata}),
    }
  }

  function isField(def: SchemaType | ObjectField): def is ObjectField {
    return !('jsonType' in def) || !def.jsonType
  }

  // eslint-disable-next-line complexity
  function getObjectDefinition(def: SchemaType | ObjectField, parent?: string): ConvertedType {
    const isInline = isField(def)
    const isDocument = def.type ? def.type.name === 'document' : false
    const actualType = isInline ? def.type : def

    if (typeNeedsHoisting(actualType)) {
      throw createLiftTypeError(def.name, parent || '', actualType.name)
    }

    if (isInline && parent && def.type.name === 'object') {
      throw createLiftTypeError(def.name, parent)
    }

    if (parent && def.type && isTopLevelType(def.type.name)) {
      return {type: getTypeName(def.type.name)} as any
    }

    const name = `${parent || ''}${getTypeName(def.name)}`
    const fields = collectFields(def)
    const firstUnprefixed = Math.max(
      0,
      fields.findIndex((field) => field.name[0] !== '_'),
    )

    const keyField = createStringField('_key')

    fields.splice(firstUnprefixed, 0, keyField)

    if (!isDocument) {
      fields.splice(firstUnprefixed + 1, 0, createStringField('_type'))
    }

    const objectIsBlock = isBlockType(def)
    const objectFields = objectIsBlock
      ? fields.filter((field) => !disabledBlockFields.includes(field.name))
      : fields

    return {
      kind: 'Type',
      name,
      type: 'Object',
      description: getDescription(def),
      fields: objectFields.map((field) =>
        isArrayOfBlocks(field)
          ? buildRawField(field, name)
          : (convertType(field, name, {
              fieldName: field.name,
              ...getDeprecation(def),
            }) as any),
      ),
      [internal]: {
        ...getDeprecation(def),
      },
    }
  }

  function buildRawField(field: ObjectField, parentName: string) {
    return {
      ...convertType(field, parentName, {fieldName: `${field.name}Raw`}),
      type: 'JSON',
      isRawAlias: true,
    }
  }

  function createStringField(name: string): ObjectField {
    return {
      name,
      type: {
        jsonType: 'string',
        name: 'string',
        type: {name: 'string', type: undefined, jsonType: 'string'},
      },
    }
  }

  function collectFields(def: SchemaType | ObjectField) {
    const fields = gatherAllFields(def)
    if (fields.length > 0) {
      return fields
    }

    const extended = getBaseType(sanitySchema, def.name as IntrinsicTypeName)
    return gatherAllFields(extended)
  }

  function getReferenceDefinition(def: SchemaType, parent: string): any {
    const base = {description: getDescription(def), isReference: true}
    const candidates = arrayify(gatherAllReferenceCandidates(def))
    if (candidates.length === 0) {
      throw new Error('No candidates for reference')
    }

    if (candidates.length === 1) {
      return {type: getTypeName(candidates[0].type.name), ...base}
    }

    const allTypeNames = candidates.map((c) => getTypeName(c.type.name))
    const targetTypes = [...new Set(allTypeNames)].sort()
    const name = targetTypes.join('Or')

    // Register the union type if we haven't seen it before
    if (!unionTypes.some((item) => item.name === name)) {
      unionTypes.push({
        kind: 'Union',
        name,
        types: targetTypes,
      })
    }

    return {
      type: name,
      ...base,
    }
  }

  function getArrayDefinition(
    def: ArraySchemaType,
    parent: string,
    options: {isField?: boolean} = {},
  ): any {
    const base = {description: getDescription(def), kind: 'List'}
    const name = !options.isField && def.name ? {name: getTypeName(def.name)} : {}
    const candidates = def.type?.type && 'of' in def.type ? arrayify(def.type.of) : def.of

    return candidates.length === 1
      ? {
          children: getArrayChildDefinition(candidates[0], def),
          ...base,
          ...name,
        }
      : {
          children: getUnionDefinition(candidates, def, {grandParent: parent}),
          ...base,
          ...name,
        }
  }

  function getArrayChildDefinition(child: SchemaType, arrayDef: SchemaType) {
    if (typeNeedsHoisting(child)) {
      // Seems to be inline? Should be hoisted?
      throw createLiftTypeError(child.name, arrayDef.name)
    }

    if (isReference(child)) {
      return getReferenceDefinition(child, arrayDef.name)
    }

    // In the case of nested scalars, recurse (markdown -> longText -> text -> string)
    if (scalars.includes(child.jsonType) && !scalars.includes(child.name)) {
      return {type: mapFieldType(child)}
    }

    return {type: getTypeName(child.name)}
  }

  function typeNeedsHoisting(type: SchemaType & {isCustomized?: boolean}): boolean {
    if (type.name === 'object') {
      return true
    }

    if (type.jsonType === 'object' && !isTopLevelType(type.name)) {
      return true
    }

    if (type.isCustomized && !isTopLevelType(type.name)) {
      return true
    }

    if (type.isCustomized && disallowedCustomizedMembers.includes(type.name)) {
      return true
    }

    return false
  }

  function getUnionDefinition(
    candidates: ObjectSchemaType[],
    parent: SchemaType,
    options: {grandParent?: string} = {},
  ) {
    if (candidates.length < 2) {
      throw new Error('Not enough candidates for a union type')
    }

    // #1482: When creating union definition do not get caught in recursion loop
    // for types that reference themselves
    const guardPathName = `${typeof parent === 'object' ? parent.name : parent}`
    if (unionRecursionGuards.has(guardPathName)) {
      return {}
    }

    const unionCacheKey = `${options.grandParent}-${guardPathName}-${candidates
      .map((c) => c.type?.name)
      .join('-')}`
    if (withUnionCache && unionDefinitionCache.has(unionCacheKey)) {
      return unionDefinitionCache.get(unionCacheKey)
    }

    try {
      unionRecursionGuards.add(guardPathName)

      candidates.forEach((def, i) => {
        if (typeNeedsHoisting(def)) {
          throw createLiftTypeArrayError(
            i,
            parent.name,
            def.type ? def.type.name : def.name,
            options.grandParent,
          )
        }
      })

      const converted = candidates.map((def) => convertType(def))

      const getName = (def: {type: string | {name: string}}): string =>
        typeof def.type === 'string' ? def.type : def.type.name

      // We might end up with union types being returned - these needs to be flattened
      // so that an ImageOr(PersonOrPet) becomes ImageOrPersonOrPet
      const flattened = converted.reduce(
        (acc, candidate) => {
          const union = unionTypes.find((item) => item.name === candidate.type)
          return union
            ? acc.concat(union.types.map((type) => ({type, isReference: candidate.isReference})))
            : acc.concat(candidate)
        },
        [] as {name?: string; type: string | {name: string}; isReference?: boolean}[],
      )

      let allCandidatesAreDocuments = true
      const refs: (string | {name: string})[] = []
      const inlineObjs: string[] = []
      const allTypeNames: string[] = []
      for (const def of flattened) {
        if (def.isReference) {
          refs.push(def.type)
        }
        if (!isReference) {
          inlineObjs.push(def.name || '')
        }

        const typeName = typeof def.type === 'string' ? def.type : def.type.name

        // Here we remove duplicates, as they might appear twice due to in-line usage of types as well as references
        if (def.name || def.type) {
          allTypeNames.push(def.isReference ? typeName : def.name || '')
        }

        const typeDef = sanityTypes.find((type) => type.name === getName(def))
        if (!typeDef || typeDef.type !== 'document') {
          allCandidatesAreDocuments = false
        }
      }

      const interfaces = allCandidatesAreDocuments ? ['Document'] : undefined
      const possibleTypes = [...new Set(allTypeNames)].sort()

      if (possibleTypes.length < 2) {
        throw new Error(`Not enough types for a union type. Parent: ${parent.name}`)
      }

      const name = possibleTypes.join('Or')

      if (!unionTypes.some((item) => item.name === name)) {
        unionTypes.push({
          kind: 'Union',
          name,
          types: possibleTypes,
          interfaces,
        })
      }

      const references = refs.length > 0 ? refs : undefined
      const inlineObjects = inlineObjs.length > 0 ? inlineObjs : undefined

      const unionDefinition = isReference(parent)
        ? {type: name, references}
        : {type: name, references, inlineObjects}

      unionDefinitionCache.set(unionCacheKey, unionDefinition)
      return unionDefinition
    } finally {
      unionRecursionGuards.delete(guardPathName)
    }
  }

  function getDocumentDefinition(def: ObjectSchemaType) {
    const objectDef = getObjectDefinition(def)
    const fields = getDocumentInterfaceFields(def).concat(objectDef.fields)

    return {...objectDef, fields, interfaces: ['Document']}
  }

  function getDocumentInterfaceDefinition(): ConvertedInterface {
    return {
      kind: 'Interface',
      name: 'Document',
      description: 'A Sanity document',
      fields: getDocumentInterfaceFields(),
    }
  }

  function getDocumentInterfaceFields(type?: ObjectSchemaType): ConvertedFieldDefinition[] {
    const isNullable = typeof nonNullDocumentFields === 'boolean' ? !nonNullDocumentFields : true
    return [
      {
        fieldName: '_id',
        type: 'ID',
        isNullable,
        description: 'Document ID',
        ...getDeprecation(type),
      },
      {
        fieldName: '_type',
        type: 'String',
        isNullable,
        description: 'Document type',
        ...getDeprecation(type),
      },
      {
        fieldName: '_createdAt',
        type: 'Datetime',
        isNullable,
        description: 'Date the document was created',
        ...getDeprecation(type),
      },
      {
        fieldName: '_updatedAt',
        type: 'Datetime',
        isNullable,
        description: 'Date the document was last modified',
        ...getDeprecation(type),
      },
      {
        fieldName: '_rev',
        type: 'String',
        isNullable,
        description: 'Current document revision',
        ...getDeprecation(type),
      },
    ]
  }

  function arrayify(thing: unknown) {
    if (Array.isArray(thing)) {
      return thing
    }

    return thing === null || typeof thing === 'undefined' ? [] : [thing]
  }

  function hasValidationFlag(
    field: SchemaType | ObjectField | ObjectFieldType,
    flag: string,
  ): boolean {
    return (
      'validation' in field &&
      Array.isArray(field.validation) &&
      field.validation.some(
        (rule) => rule && '_rules' in rule && rule._rules.some((item) => item.flag === flag),
      )
    )
  }

  function getDescription(type: SchemaType | ObjectField): string | undefined {
    const description = type.type && type.type.description
    return typeof description === 'string' ? description : undefined
  }

  function gatherAllReferenceCandidates(type: SchemaType): ObjectSchemaType[] {
    const allFields = gatherReferenceCandidates(type)
    return uniqBy(allFields, 'name')
  }

  function gatherReferenceCandidates(type: SchemaType): ObjectSchemaType[] {
    const refTo = 'to' in type ? type.to : []
    return 'type' in type && type.type ? [...gatherReferenceCandidates(type.type), ...refTo] : refTo
  }

  function gatherAllFields(type: SchemaType | ObjectField) {
    const allFields = gatherFields(type)
    return uniqBy(allFields, 'name')
  }

  function gatherFields(type: SchemaType | ObjectField): ObjectField[] {
    if ('fields' in type) {
      return type.type ? gatherFields(type.type).concat(type.fields) : type.fields
    }

    return []
  }

  function hasFieldsLikeShape(type: unknown): type is {fields: unknown} {
    return typeof type === 'object' && type !== null && 'fields' in type
  }

  function hasArrayOfFields(type: unknown): type is {fields: ObjectField[]} {
    return hasFieldsLikeShape(type) && Array.isArray(type.fields)
  }

  function hasFields(type: SchemaType | ObjectField): boolean {
    if (hasArrayOfFields(type)) {
      return gatherAllFields(type).length > 0
    }

    return 'type' in type && type.type ? hasFields(type.type) : false
  }
}

function createLiftTypeArrayError(
  index: number,
  parent: string,
  inlineType = 'object',
  grandParent = '',
) {
  const helpUrl = generateHelpUrl(helpUrls.SCHEMA_LIFT_ANONYMOUS_OBJECT_TYPE)
  const context = [grandParent, parent].filter(Boolean).join('/')
  return new HelpfulError(
    oneline`
    Encountered anonymous inline ${inlineType} at index ${index} for type/field ${context}.
    To use this type with GraphQL you will need to create a top-level schema type for it.
    See ${helpUrl}`,
    helpUrl,
  )
}

function createLiftTypeError(typeName: string, parent: string, inlineType = 'object') {
  const helpUrl = generateHelpUrl(helpUrls.SCHEMA_LIFT_ANONYMOUS_OBJECT_TYPE)
  return new HelpfulError(
    oneline`
    Encountered anonymous inline ${inlineType} "${typeName}" for field/type "${parent}".
    To use this field with GraphQL you will need to create a top-level schema type for it.
    See ${helpUrl}`,
    helpUrl,
  )
}

class HelpfulError extends Error {
  helpUrl?: string

  constructor(message: string, helpUrl?: string) {
    super(message)
    this.name = 'HelpfulError'
    this.helpUrl = helpUrl
  }
}

function getDeprecation(
  type?: SchemaType | ObjectFieldType<SchemaType> | ObjectField<SchemaType>,
): Partial<Deprecation> {
  return isDeprecationConfiguration(type)
    ? {
        deprecationReason: type.deprecated.reason,
      }
    : {}
}
