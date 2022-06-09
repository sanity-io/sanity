import {flatten} from 'lodash'
import {isNonUnion} from '../helpers'
import type {
  ConvertedField,
  ConvertedFieldDefinition,
  ConvertedType,
  ConvertedUnion,
  InputFilterField,
  InputObjectType,
} from '../types'

type FilterCreator = (field: ConvertedField) => InputFilterField[]

const filterCreators: Record<string, FilterCreator> = {
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

export function generateTypeFilters(types: (ConvertedType | ConvertedUnion)[]): InputObjectType[] {
  const queryable = types
    .filter(isNonUnion)
    .filter(
      (type) => type.type === 'Object' && type.interfaces && type.interfaces.includes('Document')
    )

  return queryable.map((type) => {
    const name = `${type.name}Filter`
    const fields = flatten(type.fields.map(createFieldFilters)).filter(Boolean)
    return {name, kind: 'InputObject', fields: [...fields, ...getDocumentFilters()]}
  })
}

function createFieldFilters(field: ConvertedField) {
  if (filterCreators[field.type]) {
    return filterCreators[field.type](field)
  }

  if (field.kind === 'List') {
    return createListFilters()
  }

  if (field.isReference) {
    return createReferenceFilters(field)
  }

  return createInlineTypeFilters()
}

function getFieldName(field: ConvertedField, modifier = '') {
  const suffix = modifier ? `_${modifier}` : ''
  return `${field.fieldName}${suffix}`
}

function getDocumentFilters(): InputFilterField[] {
  return [
    {
      fieldName: 'references',
      type: 'ID',
      description: 'All documents references the given document ID',
      constraint: {
        comparator: 'REFERENCES',
      },
    },
    {
      fieldName: 'is_draft',
      type: 'Boolean',
      description: 'All documents that are drafts',
      constraint: {
        field: '_id',
        comparator: 'IS_DRAFT',
      },
    },
  ]
}

function createEqualityFilter(field: ConvertedFieldDefinition): InputFilterField {
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

function createInequalityFilter(field: ConvertedFieldDefinition): InputFilterField {
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

function createDefaultFilters(field: ConvertedFieldDefinition): InputFilterField[] {
  return [createEqualityFilter(field), createInequalityFilter(field)]
}

function createGtLtFilters(field: ConvertedFieldDefinition): InputFilterField[] {
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

function createBooleanFilters(field: ConvertedFieldDefinition): InputFilterField[] {
  return createDefaultFilters(field)
}

function createIdFilters(field: ConvertedFieldDefinition): InputFilterField[] {
  return createStringFilters(field)
}

function createDateFilters(field: ConvertedFieldDefinition): InputFilterField[] {
  return createDefaultFilters(field).concat(createGtLtFilters(field))
}

function createStringFilters(field: ConvertedFieldDefinition): InputFilterField[] {
  return [
    ...createDefaultFilters(field),
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
  ]
}

function createNumberFilters(field: ConvertedFieldDefinition): InputFilterField[] {
  return createDefaultFilters(field).concat(createGtLtFilters(field))
}

function createObjectFilters(field: ConvertedFieldDefinition): InputFilterField[] {
  return []
}

function createListFilters(): InputFilterField[] {
  return []
}

function createInlineTypeFilters(): InputFilterField[] {
  return []
}

function createReferenceFilters(field: ConvertedFieldDefinition): InputFilterField[] {
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
