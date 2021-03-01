const {flatten} = require('lodash')

const filterCreators = {
  ID: createIdFilters,
  String: createStringFilters,
  Url: createStringFilters,
  Float: createNumberFilters,
  Integer: createNumberFilters,
  Boolean: createBooleanFilters,
  Datetime: createDateFilters,
  Date: createDateFilters,
  Object: createObjectFilters,
}

function generateTypeFilters(types) {
  const queryable = types.filter(
    (type) => type.type === 'Object' && type.interfaces && type.interfaces.includes('Document')
  )

  return queryable.map((type) => {
    const name = `${type.name}Filter`
    const fields = flatten(type.fields.map(createFieldFilters)).filter(Boolean)
    return {name, kind: 'InputObject', fields: fields.concat(getDocumentFilters(type))}
  })
}

function createFieldFilters(field) {
  if (filterCreators[field.type]) {
    return filterCreators[field.type](field)
  }

  if (field.kind === 'List') {
    return createListFilters(field)
  }

  if (field.isReference) {
    return createReferenceFilters(field)
  }

  return createInlineTypeFilters(field)
}

function getFieldName(field, modifier = '') {
  const suffix = modifier ? `_${modifier}` : ''
  return `${field.fieldName}${suffix}`
}

function getDocumentFilters(type) {
  return (
    [
      {
        fieldName: 'references',
        type: 'ID',
        description: 'All documents references the given document ID',
        constraint: {
          comparator: 'REFERENCES',
        },
      },
    ],
    {
      fieldName: 'is_draft',
      type: 'Boolean',
      description: 'All documents that are drafts',
      constraint: {
        field: '_id',
        comparator: 'IS_DRAFT',
      },
    }
  )
}

function createEqualityFilter(field) {
  return {
    fieldName: getFieldName(field),
    type: field.type,
    description: 'All documents that are equal to given value',
    constraint: {
      field: field.fieldName,
      comparator: 'EQUALS',
    },
  }
}

function createInequalityFilter(field) {
  return {
    fieldName: getFieldName(field, 'not'),
    type: field.type,
    description: 'All documents that are not equal to given value',
    constraint: {
      field: field.fieldName,
      comparator: 'NOT_EQUALS',
    },
  }
}

function createDefaultFilters(field) {
  return [createEqualityFilter(field), createInequalityFilter(field)]
}

function createGtLtFilters(field) {
  return [
    {
      fieldName: getFieldName(field, 'lt'),
      type: field.type,
      description: 'All documents are less than given value',
      constraint: {
        field: field.fieldName,
        comparator: 'LT',
      },
    },
    {
      fieldName: getFieldName(field, 'lte'),
      type: field.type,
      description: 'All documents are less than or equal to given value',
      constraint: {
        field: field.fieldName,
        comparator: 'LTE',
      },
    },
    {
      fieldName: getFieldName(field, 'gt'),
      type: field.type,
      description: 'All documents are greater than given value',
      constraint: {
        field: field.fieldName,
        comparator: 'GT',
      },
    },
    {
      fieldName: getFieldName(field, 'gte'),
      type: field.type,
      description: 'All documents are greater than or equal to given value',
      constraint: {
        field: field.fieldName,
        comparator: 'GTE',
      },
    },
  ]
}

function createBooleanFilters(field) {
  return createDefaultFilters(field)
}

function createIdFilters(field) {
  return createStringFilters(field)
}

function createDateFilters(field) {
  return createDefaultFilters(field).concat(createGtLtFilters(field))
}

function createStringFilters(field) {
  return createDefaultFilters(field).concat([
    {
      fieldName: getFieldName(field, 'matches'),
      type: 'String',
      description: 'All documents contain (match) the given word/words',
      constraint: {
        field: field.fieldName,
        comparator: 'MATCHES',
      },
    },
    {
      fieldName: getFieldName(field, 'in'),
      kind: 'List',
      children: {
        type: 'String',
        isNullable: false,
      },
      description: 'All documents match one of the given values',
      constraint: {
        field: field.fieldName,
        comparator: 'IN',
      },
    },
    {
      fieldName: getFieldName(field, 'not_in'),
      kind: 'List',
      children: {
        type: 'String',
        isNullable: false,
      },
      description: 'None of the values match any of the given values',
      constraint: {
        field: field.fieldName,
        comparator: 'NOT_IN',
      },
    },
  ])
}

function createNumberFilters(field) {
  return createDefaultFilters(field).concat(createGtLtFilters(field))
}

function createObjectFilters(field) {
  // @todo
  return []
}

function createListFilters(field) {
  // @todo
  return []
}

function createInlineTypeFilters(field) {
  // @todo
  return []
}

function createReferenceFilters(field) {
  return [
    {
      fieldName: getFieldName(field),
      type: 'ID',
      constraint: {
        field: `${field.fieldName}._ref`,
        comparator: 'EQUALS',
      },
    },
  ]
}

module.exports = generateTypeFilters
