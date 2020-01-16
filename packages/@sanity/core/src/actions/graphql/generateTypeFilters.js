const createIdFilters = require('./filters/idFilters')
const createStringFilters = require('./filters/stringFilters')
const createUrlFilters = require('./filters/urlFilters')
const createFloatFilters = require('./filters/floatFilters')
const createIntegerFilters = require('./filters/integerFilters')
const createBooleanFilters = require('./filters/booleanFilters')
const createDatetimeFilters = require('./filters/datetimeFilters')
const createDateFilters = require('./filters/dateFilters')

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
      fields: objectType.fields
        .filter(field => field.type !== 'JSON' && field.kind !== 'List')
        .map(field => ({
          fieldName: field.fieldName,
          type: `${field.type}Filter`
        }))
    }
  })
}

function createDocumentTypeFilters(documentTypes) {
  return documentTypes.map(documentType => {
    const fields = documentType.fields
      .filter(field => field.type !== 'JSON' && field.kind !== 'List')
      .map(field => ({
        fieldName: field.fieldName,
        type: `${field.type}Filter`
      }))
      .concat(getDocumentFilters())
    return {
      name: `${documentType.name}Filter`,
      kind: 'InputObject',
      fields
    }
  })
}

function getDocumentFilters(type) {
  return (
    [
      {
        fieldName: 'references',
        type: 'ID',
        description: 'All documents references the given document ID',
        constraint: {
          comparator: 'REFERENCES'
        }
      }
    ],
    {
      fieldName: 'is_draft',
      type: 'Boolean',
      description: 'All documents that are drafts',
      constraint: {
        field: '_id',
        comparator: 'IS_DRAFT'
      }
    }
  )
}

module.exports = generateTypeFilters
