import {error, HELP_IDS} from '../createValidationResult'

export default (typeDef, visitorContext) => {
  const problems = []

  if (
    typeDef.options &&
    typeof typeDef.options.metadata !== 'undefined' &&
    !Array.isArray(typeDef.options.metadata)
  ) {
    problems.push(
      error(
        `Invalid type for file \`metadata\` field - must be an array of strings`,
        HELP_IDS.ASSET_METADATA_FIELD_INVALID
      )
    )
  }

  return {
    ...typeDef,
    _problems: problems
  }
}
