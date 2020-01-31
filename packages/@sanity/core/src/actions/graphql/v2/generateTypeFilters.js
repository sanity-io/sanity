const createIdFilters = require('./filters/idFilters')
const createStringFilters = require('./filters/stringFilters')
const createUrlFilters = require('./filters/urlFilters')
const createFloatFilters = require('./filters/floatFilters')
const createIntegerFilters = require('./filters/integerFilters')
const createBooleanFilters = require('./filters/booleanFilters')
const createDatetimeFilters = require('./filters/datetimeFilters')
const createDateFilters = require('./filters/dateFilters')

const typeAliases = {
  Text: 'String',
  Email: 'String'
}

const filterCreators = {
  ID: createIdFilters,
  String: createStringFilters,
  Url: createUrlFilters,
  Float: createFloatFilters,
  Integer: createIntegerFilters,
  Boolean: createBooleanFilters,
  Datetime: createDatetimeFilters,
  Date: createDateFilters
}

function generateTypeFilters(types) {
  const builtInTypeKeys = Object.keys(filterCreators)
  const builtinTypeValues = Object.values(filterCreators)
  const objectTypes = types.filter(
    type =>
      type.type === 'Object' &&
      !['Block', 'Span'].includes(type.name) && // TODO: What do we do with blocks?
      !type.interfaces &&
      !builtInTypeKeys.includes(type.type)
  )
  const documentTypes = types.filter(
    type => type.type === 'Object' && type.interfaces && type.interfaces.includes('Document')
  )

  const builtinTypeFilters = createBuiltinTypeFilters(builtinTypeValues)
  const objectTypeFilters = createObjectTypeFilters(objectTypes)
  const documentTypeFilters = createDocumentTypeFilters(documentTypes)

  return builtinTypeFilters.concat(objectTypeFilters).concat(documentTypeFilters)
}

function createBuiltinTypeFilters(builtinTypeValues) {
  return builtinTypeValues.map(filterCreator => filterCreator())
}

function createObjectTypeFilters(objectTypes) {
  return objectTypes.map(objectType => {
    return {
      name: `${objectType.name}Filter`,
      kind: 'InputObject',
      fields: createFieldFilters(objectType)
    }
  })
}

function createDocumentTypeFilters(documentTypes) {
  return documentTypes.map(documentType => {
    const fields = createFieldFilters(documentType).concat(getDocumentFilters())
    return {
      name: `${documentType.name}Filter`,
      kind: 'InputObject',
      fields
    }
  })
}

function createFieldFilters(objectType) {
  return objectType.fields
    .filter(field => field.type !== 'JSON' && field.kind !== 'List')
    .map(field => ({
      fieldName: field.fieldName,
      type: `${typeAliases[field.type] || field.type}Filter`
    }))
}

function getDocumentFilters() {
  return [
    {
      fieldName: 'references',
      type: 'ID',
      description: 'All documents referencing the given document ID.'
    },
    {
      fieldName: 'is_draft',
      type: 'Boolean',
      description: 'All documents that are drafts.'
    }
  ]
}

module.exports = generateTypeFilters
