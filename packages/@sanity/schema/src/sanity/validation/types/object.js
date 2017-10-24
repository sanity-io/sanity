// @flow
import {error, warning} from '../createValidationResult'
import inspect from '../../inspect'

const VALID_FIELD_RE = /^[A-Za-z]+[0-9A-Za-z_\s-]*$/
const CONVENTIONAL_FIELD_RE = /^[A-Za-z_]+[0-9A-Za-z_]*$/

function validateFieldName(name): Array<any> {
  if (typeof name !== 'string') {
    return [
      error(
        `Field names must be strings. Saw "${inspect(name)}"`,
        'field-names-must-be-strings'
      )
    ]
  }
  if (name.startsWith('_')) {
    return [
      error(
        `Invalid field name "${name}". Field names cannot start with underscores "_" as it's reserved for system fields.`
      )
    ]
  }

  if (!VALID_FIELD_RE.test(name)) {
    return [
      error(
        `Invalid field name: ${name
        }. Fields can only contain characters from a-z, numbers and underscores and should not start with a number (${
          String(
            VALID_FIELD_RE
          )})`
      )
    ]
  }
  if (!CONVENTIONAL_FIELD_RE.test(name)) {
    return [
      warning(
        'Thats an interesting field name for sure! But it is... how to put it... a bit... unconventional?'
      + ' It may be wise to keep special character out of field names for easier access later on.'
      )
    ]
  }
  return []
}

function validateField(field, visitorContext) {
  const {name, fieldset, ...fieldType} = field
  return ('name' in field)
    ? validateFieldName(name)
    : [error('Missing field name', 'field-names-must-be-defined')]

}

function getDuplicateFields(array: Array<Field>): Array<Array<Field>> {
  const dupes: { [string]: Array<Field> } = {}
  array.forEach(field => {
    if (!dupes[field.name]) {
      dupes[field.name] = []
    }
    dupes[field.name].push(field)
  })
  return Object.keys(dupes)
    .map(fieldName => (dupes[fieldName].length > 1 ? dupes[fieldName] : null))
    .filter(Boolean)
}

export default (typeDef, visitorContext) => {
  const problems = []
  const fieldsIsArray = Array.isArray(typeDef.fields)
  if (fieldsIsArray) {
    const fieldsWithNames = typeDef.fields.filter(
      field => typeof field.name === 'string'
    )

    getDuplicateFields(fieldsWithNames).forEach(dupes => {
      problems.push(
        error(
          `Found ${dupes.length} fields with name "${dupes[0]
            .name}" in object`,
          'schema-object-type-fields-not-unique'
        )
      )
    })
    if (typeDef.fields.length === 0) {
      problems.push(error(
        'Object should have at least one field',
        'schema-object-type-fields-must-be-array'
      ))
    }
  } else {
    problems.push(
      error(
        `The "fields" property must be an array of fields. Instead saw "${typeof typeDef.fields}"`,
        'schema-object-type-fields-must-be-array'
      )
    )
  }


  return {
    ...typeDef,
    fields: (fieldsIsArray ? typeDef.fields : []).map(field => {
      const {name, ...fieldTypeDef} = field
      const {_problems, ...fieldType} = visitorContext.visit(fieldTypeDef, visitorContext)
      return {
        name,
        ...fieldType,
        _problems: validateField(field, visitorContext).concat(_problems || [])
      }
    }),
    _problems: problems
  }
}
