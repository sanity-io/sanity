import {isPlainObject} from 'lodash'
import {error, HELP_IDS, warning} from '../createValidationResult'
import inspect from '../../inspect'

const VALID_FIELD_RE = /^[A-Za-z]+[0-9A-Za-z_]*$/
const CONVENTIONAL_FIELD_RE = /^[A-Za-z_]+[0-9A-Za-z_]*$/
interface Field {
  name: string
}

function validateFieldName(name): Array<any> {
  if (typeof name !== 'string') {
    return [
      error(
        `Field names must be strings. Saw "${inspect(name)}"`,
        HELP_IDS.OBJECT_FIELD_NAME_INVALID
      )
    ]
  }
  if (name.startsWith('_')) {
    return [
      error(
        `Invalid field name "${name}". Field names cannot start with underscores "_" as it's reserved for system fields.`,
        HELP_IDS.OBJECT_FIELD_NAME_INVALID
      )
    ]
  }

  if (!VALID_FIELD_RE.test(name)) {
    return [
      error(
        `Invalid field name: "${name}". Fields can only contain characters from A-Z, numbers and underscores and should not start with a number (must pass the regular expression ${String(
          VALID_FIELD_RE
        )}).`,
        HELP_IDS.OBJECT_FIELD_NAME_INVALID
      )
    ]
  }
  if (!CONVENTIONAL_FIELD_RE.test(name)) {
    return [
      warning(
        'Thats an interesting field name for sure! But it is... how to put it... a bit... unconventional?' +
          ' It may be wise to keep special characters out of field names for easier access later on.'
      ),
      HELP_IDS.OBJECT_FIELD_NAME_INVALID
    ]
  }
  return []
}

export function validateField(field, visitorContext) {
  if (!isPlainObject(field)) {
    return [
      error(
        `Incorrect type for field definition - should be an object, saw ${inspect(field)}`,
        HELP_IDS.OBJECT_FIELD_DEFINITION_INVALID_TYPE
      )
    ]
  }

  const {name, fieldset, ...fieldType} = field
  return 'name' in field
    ? validateFieldName(name)
    : [error('Missing field name', HELP_IDS.OBJECT_FIELD_NAME_INVALID)]
}

function getDuplicateFields(array: Array<Field>): Array<Array<Field>> {
  const dupes: {[name: string]: Array<Field>} = {}
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

export function validateFields(fields: any, options = {allowEmpty: false}) {
  const problems = []
  const fieldsIsArray = Array.isArray(fields)
  if (!fieldsIsArray) {
    return [
      error(
        `The "fields" property must be an array of fields. Instead saw "${typeof fields}"`,
        HELP_IDS.OBJECT_FIELDS_INVALID
      )
    ]
  }

  const fieldsWithNames = fields.filter(field => typeof field.name === 'string')

  getDuplicateFields(fieldsWithNames).forEach(dupes => {
    problems.push(
      error(
        `Found ${dupes.length} fields with name "${dupes[0].name}" in object`,
        HELP_IDS.OBJECT_FIELD_NOT_UNIQUE
      )
    )
  })

  if (fields.length === 0 && !options.allowEmpty) {
    problems.push(error('Object should have at least one field', HELP_IDS.OBJECT_FIELDS_INVALID))
  }

  return problems
}

export default (typeDef, visitorContext) => {
  const problems = validateFields(typeDef.fields)

  if (typeDef.type !== 'document' && typeof typeDef.initialValue !== 'undefined') {
    problems.push(
      error(`The "initialValue" property is currently only supported for document types.`)
    )
  }

  return {
    ...typeDef,
    fields: (Array.isArray(typeDef.fields) ? typeDef.fields : []).map(field => {
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
