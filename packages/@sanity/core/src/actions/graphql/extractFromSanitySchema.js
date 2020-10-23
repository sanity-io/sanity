const {uniqBy, startCase} = require('lodash')
const generateHelpUrl = require('@sanity/generate-help-url')
const schemaCompiler = require('@sanity/schema')
const oneline = require('oneline')
const helpUrls = require('./helpUrls')
const SchemaError = require('./SchemaError')

const Schema = schemaCompiler.default || schemaCompiler
const skipTypes = ['document', 'reference']
const allowedJsonTypes = ['object', 'array']
const disallowedCustomizedMembers = ['object', 'array', 'image', 'file', 'block']
const scalars = ['string', 'number', 'boolean']

function getBaseType(baseSchema, typeName) {
  return Schema.compile({
    types: baseSchema._original.types.concat([
      {name: `__placeholder__`, type: typeName, options: {hotspot: true}},
    ]),
  }).get('__placeholder__')
}

function getTypeName(str) {
  const name = startCase(str).replace(/\s+/g, '')
  return name === 'Number' ? 'Float' : name
}

function isBaseType(type) {
  return (
    type.name !== type.jsonType &&
    allowedJsonTypes.includes(type.jsonType) &&
    !skipTypes.includes(type.name) &&
    !isReference(type)
  )
}

function hasBlockParent(typeDef) {
  if (typeDef.type && typeDef.type.name === 'block' && !typeDef.type.type) {
    return true
  }

  return Boolean(typeDef.type && hasBlockParent(typeDef.type))
}

function isArrayOfBlocks(typeDef) {
  const type = typeDef.type || typeDef
  if (type.jsonType !== 'array') {
    return false
  }

  return (type.of || []).some(hasBlockParent)
}

function isReference(typeDef) {
  let type = typeDef
  while (type) {
    if (type.name === 'reference' || (type.type && type.type.name === 'reference')) {
      return true
    }

    type = type.type
  }
  return false
}

function extractFromSanitySchema(sanitySchema) {
  const unionRecursionGuards = []
  const hasErrors =
    sanitySchema._validation &&
    sanitySchema._validation.some((group) =>
      group.problems.some((problem) => problem.severity === 'error')
    )

  if (hasErrors) {
    throw new SchemaError(sanitySchema._validation)
  }

  const sanityTypes = sanitySchema._original.types
  const typeNames = sanitySchema.getTypeNames()
  const unionTypes = []
  const types = typeNames
    .map((name) => sanitySchema.get(name))
    .filter(isBaseType)
    .map((type) => convertType(type))
    .concat(unionTypes)

  return {types, interfaces: [getDocumentInterfaceDefinition()]}

  function isTopLevelType(typeName) {
    return typeNames.includes(typeName)
  }

  function mapFieldType(field, name) {
    if (!field.type) {
      throw new Error('Field has no type!')
    }

    const isScalar = scalars.includes(field.jsonType)
    if (isScalar && field.jsonType === 'number') {
      return hasValidationFlag(field, 'integer') ? 'Int' : 'Float'
    } else if (isScalar) {
      return getTypeName(field.jsonType)
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

  function _convertType(type, parent, options) {
    let name = type.type ? type.type.name : type.jsonType

    if (isReference(type)) {
      name = 'reference'
    }

    if (type.jsonType === 'array' || (type.type && type.type.jsonType === 'array')) {
      name = 'array'
    }

    switch (name) {
      case 'document':
        return getDocumentDefinition(type, parent)
      case 'object':
      case 'block':
        return getObjectDefinition(type, parent)
      case 'reference':
        return getReferenceDefinition(type, parent)
      case 'array':
        return getArrayDefinition(type, parent, options)
      default:
        return hasFields(type)
          ? getObjectDefinition(type, parent)
          : {
              type: mapFieldType(type, name),
              description: getDescription(type),
            }
    }
  }

  function convertType(type, parent, props = {}) {
    const mapped = _convertType(type, parent, {isField: Boolean(props.fieldName)})
    const gqlName = props.fieldName || mapped.name
    const originalName = type.name
    const original = gqlName === originalName ? {} : {originalName: originalName}
    return Object.assign({}, props, mapped, original)
  }

  // eslint-disable-next-line complexity
  function getObjectDefinition(def, parent) {
    const isInline = !def.jsonType
    const isDocument = def.type && def.type.name === 'document'
    const actualType = isInline ? def.type : def

    if (typeNeedsHoisting(actualType)) {
      throw createLiftTypeError(def.name, parent, actualType.name)
    }

    if (isInline && parent && def.type.name === 'object') {
      throw createLiftTypeError(def.name, parent)
    }

    if (parent && isTopLevelType(def.type.name)) {
      return {type: getTypeName(def.type.name)}
    }

    const name = `${parent || ''}${getTypeName(def.name)}`
    const fields = collectFields(def)
    const firstUnprefixed = Math.max(
      0,
      fields.findIndex((field) => field.name[0] !== '_')
    )
    fields.splice(
      firstUnprefixed,
      0,
      ...[createStringField('_key'), !isDocument && createStringField('_type')].filter(Boolean)
    )

    return {
      kind: 'Type',
      name,
      type: 'Object',
      description: getDescription(def),
      fields: fields.map((field) =>
        isArrayOfBlocks(field)
          ? buildRawField(field, name)
          : convertType(field, name, {fieldName: field.name})
      ),
    }
  }

  function buildRawField(field, parentName) {
    return Object.assign(convertType(field, parentName, {fieldName: `${field.name}Raw`}), {
      type: 'JSON',
      isRawAlias: true,
    })
  }

  function createStringField(name) {
    return {
      name,
      type: {
        jsonType: 'string',
        name: 'string',
        type: {name: 'string', type: null, jsonType: 'string'},
      },
    }
  }

  function collectFields(def) {
    const fields = gatherAllFields(def)
    if (fields.length > 0) {
      return fields
    }

    const extended = getBaseType(sanitySchema, def.name)
    return gatherAllFields(extended)
  }

  function getReferenceDefinition(def, parent) {
    const base = {description: getDescription(def), isReference: true}
    const candidates = arrayify(gatherAllFields(def, 'to'))
    return candidates.length === 1
      ? Object.assign({type: getTypeName(candidates[0].type.name)}, base)
      : Object.assign(getUnionDefinition(candidates, def, {grandParent: parent}), base)
  }

  function getArrayDefinition(def, parent, options = {}) {
    const base = {description: getDescription(def), kind: 'List'}
    const name = !options.isField && def.name ? {name: getTypeName(def.name)} : {}
    const candidates = def.type.type ? arrayify(def.type.of) : def.of

    return candidates.length === 1
      ? Object.assign({children: getArrayChildDefinition(candidates[0], def)}, base, name)
      : Object.assign(
          {children: getUnionDefinition(candidates, def, {grandParent: parent})},
          base,
          name
        )
  }

  function getArrayChildDefinition(child, arrayDef) {
    if (typeNeedsHoisting(child)) {
      // Seems to be inline? Should be hoisted?
      throw createLiftTypeError(child.name, arrayDef.name)
    }

    if (isReference(child)) {
      return getReferenceDefinition(child, arrayDef)
    }

    // In the case of nested scalars, recurse (markdown -> longText -> text -> string)
    if (scalars.includes(child.jsonType) && !scalars.includes(child.name)) {
      return {type: mapFieldType(child)}
    }

    return {type: getTypeName(child.name)}
  }

  function typeNeedsHoisting(type) {
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

  function getUnionDefinition(candidates, parent, options = {}) {
    // #1482: When creating union definition do not get caught in recursion loop
    // for types that reference themselves
    if (unionRecursionGuards.includes(parent)) {
      return {}
    }

    try {
      unionRecursionGuards.push(parent)

      candidates.forEach((def, i) => {
        if (typeNeedsHoisting(def)) {
          throw createLiftTypeArrayError(
            i,
            parent.name,
            def.type ? def.type.name : def.name,
            options.grandParent
          )
        }
      })

      const converted = candidates.map((def) => convertType(def))

      // We might end up with union types being returned - these needs to be flattened
      // so that an ImageOr(PersonOrPet) becomes ImageOrPersonOrPet
      const flattened = converted.reduce((acc, candidate) => {
        const union = unionTypes.find((item) => item.name === candidate.type)
        return union
          ? acc.concat(union.types.map((type) => ({type, isReference: candidate.isReference})))
          : acc.concat(candidate)
      }, [])

      const allCandidatesAreDocuments = flattened.every((def) => {
        const typeDef = sanityTypes.find((type) => type.name === (def.type.name || def.type))
        return typeDef && typeDef.type === 'document'
      })

      const interfaces = allCandidatesAreDocuments ? ['Document'] : undefined
      const refs = flattened.filter((type) => type.isReference).map((ref) => ref.type)
      const inlineObjs = flattened.filter((type) => !type.isReference).map((ref) => ref.name)
      // Here we remove duplicates, as they might appear twice due to in-line usage of types as well as references
      const possibleTypes = [
        ...new Set(flattened.map((type) => (type.isReference ? type.type : type.name))),
      ].sort()
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
      return isReference(parent)
        ? {type: name, references}
        : {type: name, references, inlineObjects}
    } finally {
      const parentIndex = unionRecursionGuards.indexOf(parent)
      if (parentIndex !== -1) {
        unionRecursionGuards.splice(parentIndex, 1)
      }
    }
  }

  function getDocumentDefinition(def) {
    const objectDef = getObjectDefinition(def)
    const fields = getDocumentInterfaceFields().concat(objectDef.fields)

    return Object.assign(objectDef, {
      fields,
      interfaces: ['Document'],
    })
  }

  function getDocumentInterfaceDefinition() {
    return {
      kind: 'Interface',
      name: 'Document',
      description: 'A Sanity document',
      fields: getDocumentInterfaceFields(),
    }
  }

  function getDocumentInterfaceFields() {
    return [
      {
        fieldName: '_id',
        type: 'ID',
        isNullable: true,
        description: 'Document ID',
      },
      {
        fieldName: '_type',
        type: 'String',
        isNullable: true,
        description: 'Document type',
      },
      {
        fieldName: '_createdAt',
        type: 'Datetime',
        isNullable: true,
        description: 'Date the document was created',
      },
      {
        fieldName: '_updatedAt',
        type: 'Datetime',
        isNullable: true,
        description: 'Date the document was last modified',
      },
      {
        fieldName: '_rev',
        type: 'String',
        isNullable: true,
        description: 'Current document revision',
      },
    ]
  }

  function arrayify(thing) {
    if (Array.isArray(thing)) {
      return thing
    }

    return thing === null || typeof thing === 'undefined' ? [] : [thing]
  }

  function hasValidationFlag(field, flag) {
    return (
      field.validation &&
      field.validation.some((rule) => rule._rules && rule._rules.some((item) => item.flag === flag))
    )
  }

  function getDescription(type) {
    const description = type.type && type.type.description
    return typeof description === 'string' ? description : undefined
  }

  function gatherAllFields(type, field = 'fields') {
    const allFields = gatherFields(type, field)
    return uniqBy(allFields, 'name')
  }

  function gatherFields(type, field = 'fields') {
    const current = type[field] || []
    return type.type ? gatherFields(type.type, field).concat(current) : current
  }

  function hasFields(type) {
    return gatherAllFields(type).length > 0
  }
}

function createLiftTypeArrayError(index, parent, inlineType = 'object', grandParent = '') {
  const helpUrl = generateHelpUrl(helpUrls.SCHEMA_LIFT_ANONYMOUS_OBJECT_TYPE)
  const context = [grandParent, parent].filter(Boolean).join('/')
  const err = new Error(oneline`
    Encountered anonymous inline ${inlineType} at index ${index} for type/field ${context}.
    To use this type with GraphQL you will need to create a top-level schema type for it.
    See ${helpUrl}
  `)

  err.helpUrl = helpUrl
  return err
}

function createLiftTypeError(typeName, parent, inlineType = 'object') {
  const helpUrl = generateHelpUrl(helpUrls.SCHEMA_LIFT_ANONYMOUS_OBJECT_TYPE)
  const err = new Error(oneline`
    Encountered anonymous inline ${inlineType} "${typeName}" for field/type "${parent}".
    To use this field with GraphQL you will need to create a top-level schema type for it.
    See ${helpUrl}
  `)

  err.helpUrl = helpUrl
  return err
}

module.exports = extractFromSanitySchema
