import {error, warning, HELP_IDS} from '../createValidationResult'
import {validateFields, validateField} from './object'

const autoMeta = ['dimensions', 'hasAlpha', 'isOpaque']

export default (typeDef, visitorContext) => {
  const problems = []
  const fields = typeDef.fields

  if (fields) {
    problems.push(...validateFields(fields, {allowEmpty: true}))
  }

  let options = typeDef.options
  const metadata = options?.metadata
  const superfluousMeta = Array.isArray(metadata)
    ? metadata.filter((meta) => autoMeta.includes(meta))
    : []

  const invalidFieldNames = ['asset', 'hotspot', 'crop']

  const fieldsWithInvalidName = Array.isArray(fields)
    ? fields?.filter((field) => invalidFieldNames.includes(field.name))
    : []

  if (typeof metadata !== 'undefined' && !Array.isArray(metadata)) {
    problems.push(
      error(
        `Invalid type for image \`metadata\` field - must be an array of strings`,
        HELP_IDS.ASSET_METADATA_FIELD_INVALID
      )
    )
  } else if (superfluousMeta.length > 0) {
    problems.push(
      warning(
        `Image \`metadata\` field contains superfluous properties (they are always included): ${superfluousMeta.join(
          ', '
        )}`
      )
    )
    options = {...options, metadata: metadata.filter((meta) => !autoMeta.includes(meta))}
  } else if (fieldsWithInvalidName.length > 0) {
    problems.push(
      error(
        `The names \`${invalidFieldNames.join(
          '`, `'
        )}\` are invalid field names for type \`image\`.`
      )
    )
  }

  return {
    ...typeDef,
    options,
    fields: (Array.isArray(fields) ? fields : []).map((field, index) => {
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
