import {error, HELP_IDS, warning} from '../createValidationResult'

export default (typeDef, visitorContext) => {
  const problems = []
  if (!typeDef.name) {
    problems.push(error('Missing type name', HELP_IDS.TYPE_MISSING_NAME))
  } else if (visitorContext.isReserved(typeDef.name)) {
    problems.push(error(`Invalid type name: "${typeDef.name}" is reserved`, HELP_IDS.TYPE_NAME_RESERVED))
  }

  if (visitorContext.isDuplicate(typeDef.name)) {
    problems.push(error(
      `Invalid type name: A type with name "${typeDef.name}" is already defined.`,
      HELP_IDS.TYPE_NAME_NOT_UNIQUE
    ))
  }

  if (!('title' in typeDef)) {
    problems.push(warning(
      'Type is missing title. It\'s recommended to always set a descriptive title',
      HELP_IDS.TYPE_TITLE_RECOMMENDED
    ))
  } else if (typeof typeDef.title !== 'string') {
    problems.push(warning(
      'Type title is not a string.',
      HELP_IDS.TYPE_TITLE_INVALID
    ))
  }
  return {
    ...typeDef,
    _problems: problems
  }
}
