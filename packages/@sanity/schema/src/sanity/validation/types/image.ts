import {error, HELP_IDS} from '../createValidationResult'
import {validateFields, validateField} from './object'

export default (typeDef, visitorContext) => {
  const problems = []
  let fields = typeDef.fields

  if (fields) {
    problems.push(...validateFields(fields, {allowEmpty: true}))
  }

  if (
    typeDef.options &&
    typeof typeDef.options.metadata !== 'undefined' &&
    !Array.isArray(typeDef.options.metadata)
  ) {
    problems.push(
      error(
        `Invalid type for image \`metadata\` field - must be an array of strings`,
        HELP_IDS.ASSET_METADATA_FIELD_INVALID
      )
    )
  }

  return {
    ...typeDef,
    fields: (Array.isArray(fields) ? fields : []).map(field => {
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
