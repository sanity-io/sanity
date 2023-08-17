import {error, HELP_IDS} from '../createValidationResult'
import {validateFields, validateField} from './object'

export default (typeDef, visitorContext) => {
  const problems = []
  const fields = typeDef.fields

  if (fields) {
    problems.push(...validateFields(fields, {allowEmpty: true}))
  }

  const invalidFieldNames = Array.isArray(fields)
    ? fields?.filter((field) => field.name === 'asset')
    : []

  if (
    typeDef.options &&
    typeof typeDef.options.metadata !== 'undefined' &&
    !Array.isArray(typeDef.options.metadata)
  ) {
    problems.push(
      error(
        `Invalid type for file \`metadata\` field - must be an array of strings`,
        HELP_IDS.ASSET_METADATA_FIELD_INVALID,
      ),
    )
  } else if (invalidFieldNames.length > 0) {
    problems.push(error('The name `asset` is not a valid field name for type `file`.'))
  }

  return {
    ...typeDef,
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
