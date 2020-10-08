const createBooleanFilters = require('./filters/booleanFilters')
const createDateFilters = require('./filters/dateFilters')
const createDatetimeFilters = require('./filters/dateTimeFilters')
const createDocumentFilters = require('./filters/documentFilters')
const createFloatFilters = require('./filters/floatFilters')
const createIdFilters = require('./filters/idFilters')
const createIntegerFilters = require('./filters/integerFilters')
const createStringFilters = require('./filters/stringFilters')

const typeAliases = {
  Url: 'String',
  Text: 'String',
  Email: 'String',
}

const filterCreators = {
  ID: createIdFilters,
  String: createStringFilters,
  Float: createFloatFilters,
  Integer: createIntegerFilters,
  Boolean: createBooleanFilters,
  Datetime: createDatetimeFilters,
  Date: createDateFilters,
  Document: createDocumentFilters,
}

function generateTypeFilters(types) {
  const builtInTypeKeys = Object.keys(filterCreators)
  const builtinTypeValues = Object.values(filterCreators)
  const objectTypes = types.filter(
    (type) =>
      type.type === 'Object' &&
      !['Block', 'Span'].includes(type.name) && // TODO: What do we do with blocks?
      !type.interfaces &&
      !builtInTypeKeys.includes(type.type)
  )

  const unionTypes = types.filter((type) => type.kind === 'Union').map((type) => type.name)
  const documentTypes = types.filter(
    (type) =>
      type.name === 'Document' ||
      (type.type === 'Object' && type.interfaces && type.interfaces.includes('Document'))
  )

  const builtinTypeFilters = createBuiltinTypeFilters(builtinTypeValues)
  const objectTypeFilters = createObjectTypeFilters(objectTypes, {unionTypes})
  const documentTypeFilters = createDocumentTypeFilters(documentTypes, {unionTypes})

  return builtinTypeFilters.concat(objectTypeFilters).concat(documentTypeFilters)
}

function createBuiltinTypeFilters(builtinTypeValues) {
  return builtinTypeValues.map((filterCreator) => filterCreator())
}

function createObjectTypeFilters(objectTypes, options) {
  return objectTypes.map((objectType) => {
    return {
      name: `${objectType.name}Filter`,
      kind: 'InputObject',
      fields: createFieldFilters(objectType, options),
    }
  })
}

function createDocumentTypeFilters(documentTypes, options) {
  return documentTypes.map((documentType) => {
    const fields = getDocumentFilters().concat(createFieldFilters(documentType, options))
    return {
      name: `${documentType.name}Filter`,
      kind: 'InputObject',
      fields,
    }
  })
}

function createFieldFilters(objectType, options) {
  const {unionTypes} = options
  return objectType.fields
    .filter(
      (field) => field.type !== 'JSON' && field.kind !== 'List' && !unionTypes.includes(field.type)
    )
    .map((field) => ({
      fieldName: field.fieldName,
      type: `${typeAliases[field.type] || field.type}Filter`,
      isReference: field.isReference,
    }))
}

function getDocumentFilters() {
  return [
    {
      fieldName: '_',
      type: 'GlobalDocumentFilter',
      description: 'Apply filters on document level',
    },
  ]
}

module.exports = generateTypeFilters
