import {isPlainObject} from 'lodash'
import {error, HELP_IDS, warning} from '../createValidationResult'
import inspect from '../../inspect'
import {validateComponent} from '../utils/validateComponent'

const VALID_FIELD_RE = /^[A-Za-z]+[0-9A-Za-z_]*$/
const CONVENTIONAL_FIELD_RE = /^[A-Za-z_]+[0-9A-Za-z_]*$/
interface Field {
  name: string
}

interface PreviewConfig {
  select?: {
    [key: string]: string
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  prepare?: Function
}

function validateFieldName(name): Array<any> {
  if (typeof name !== 'string') {
    return [
      error(
        `Field names must be strings. Saw "${inspect(name)}"`,
        HELP_IDS.OBJECT_FIELD_NAME_INVALID,
      ),
    ]
  }
  if (name.startsWith('_')) {
    return [
      error(
        `Invalid field name "${name}". Field names cannot start with underscores "_" as it's reserved for system fields.`,
        HELP_IDS.OBJECT_FIELD_NAME_INVALID,
      ),
    ]
  }

  if (!VALID_FIELD_RE.test(name)) {
    return [
      error(
        `Invalid field name: "${name}". Fields can only contain characters from A-Z, numbers and underscores and should not start with a number (must pass the regular expression ${String(
          VALID_FIELD_RE,
        )}).`,
        HELP_IDS.OBJECT_FIELD_NAME_INVALID,
      ),
    ]
  }
  if (!CONVENTIONAL_FIELD_RE.test(name)) {
    return [
      warning(
        'Thats an interesting field name for sure! But it is... how to put it... a bit... unconventional?' +
          ' It may be wise to keep special characters out of field names for easier access later on.',
      ),
      HELP_IDS.OBJECT_FIELD_NAME_INVALID,
    ]
  }
  return []
}

export function validateField(field, _visitorContext) {
  if (!isPlainObject(field)) {
    return [
      error(
        `Incorrect type for field definition - should be an object, saw ${inspect(field)}`,
        HELP_IDS.OBJECT_FIELD_DEFINITION_INVALID_TYPE,
      ),
    ]
  }

  const problems = []
  problems.push(
    ...('name' in field
      ? validateFieldName(field.name)
      : [error('Missing field name', HELP_IDS.OBJECT_FIELD_NAME_INVALID)]),
  )
  problems.push(...validateComponent(field))
  return problems
}

function getDuplicateFields(array: Array<Field>): Array<Array<Field>> {
  const dupes: {[name: string]: Array<Field>} = {}
  array.forEach((field) => {
    if (!dupes[field.name]) {
      dupes[field.name] = []
    }
    dupes[field.name].push(field)
  })
  return Object.keys(dupes)
    .map((fieldName) => (dupes[fieldName].length > 1 ? dupes[fieldName] : null))
    .filter(Boolean)
}

export function validateFields(fields: any, options = {allowEmpty: false}) {
  const problems = []
  const fieldsIsArray = Array.isArray(fields)
  if (!fieldsIsArray) {
    return [
      error(
        `The "fields" property must be an array of fields. Instead saw "${typeof fields}"`,
        HELP_IDS.OBJECT_FIELDS_INVALID,
      ),
    ]
  }

  const fieldsWithNames = fields.filter((field) => typeof field.name === 'string')

  getDuplicateFields(fieldsWithNames).forEach((dupes) => {
    problems.push(
      error(
        `Found ${dupes.length} fields with name "${dupes[0].name}" in object`,
        HELP_IDS.OBJECT_FIELD_NOT_UNIQUE,
      ),
    )
  })

  if (fields.length === 0 && !options.allowEmpty) {
    problems.push(error('Object should have at least one field', HELP_IDS.OBJECT_FIELDS_INVALID))
  }

  const standaloneBlockFields = fields
    .filter((field) => field.type === 'block')
    .map((field) => `"${field.name}"`)

  if (standaloneBlockFields.length > 0) {
    const fmtFields = standaloneBlockFields.join(', ')
    problems.push(
      error(
        `Invalid standalone block field(s) ${fmtFields}. Block content must be defined as an array of blocks`,
        HELP_IDS.STANDALONE_BLOCK_TYPE,
      ),
    )
  }

  return problems
}

export function validatePreview(preview: PreviewConfig) {
  if (!isPlainObject(preview)) {
    return [error(`The "preview" property must be an object, instead saw "${typeof preview}"`)]
  }

  if (typeof preview.prepare !== 'undefined' && typeof preview.prepare !== 'function') {
    return [
      error(
        `The "preview.prepare" property must be a function, instead saw "${typeof preview.prepare}"`,
      ),
    ]
  }

  if (!preview.select) {
    return []
  }

  if (!isPlainObject(preview.select)) {
    return [
      error(
        `The "preview.select" property must be an object, instead saw "${typeof preview.prepare}"`,
      ),
    ]
  }

  return Object.keys(preview.select).reduce((errs, key) => {
    return typeof preview.select[key] === 'string'
      ? errs
      : errs.concat(
          error(
            `The key "${key}" of "preview.select" must be a string, instead saw "${typeof preview
              .select[key]}"`,
          ),
        )
  }, [])
}

export default (typeDef, visitorContext) => {
  let problems = validateFields(typeDef.fields)

  let preview = typeDef.preview
  if (preview) {
    const previewErrors = validatePreview(typeDef.preview)
    problems = problems.concat(previewErrors)
    preview = previewErrors.some((err) => err.severity === 'error') ? {} : preview
  }

  if (
    typeDef.type !== 'document' &&
    typeDef.type !== 'object' &&
    typeof typeDef.initialValue !== 'undefined'
  ) {
    problems.push(
      error(`The "initialValue" property is currently only supported for document & object types.`),
    )
  }

  return {
    ...typeDef,
    preview,
    fields: (Array.isArray(typeDef.fields) ? typeDef.fields : []).map((field, index) => {
      const {name, ...fieldTypeDef} = field
      const {_problems, ...fieldType} = visitorContext.visit(fieldTypeDef, index)
      return {
        name,
        ...fieldType,
        _problems: validateField(field, visitorContext).concat(_problems || []),
      }
    }),
    _problems: problems,
  }
}
