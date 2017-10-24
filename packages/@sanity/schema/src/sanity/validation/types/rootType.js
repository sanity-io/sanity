import {error, warning} from '../createValidationResult'


export default (typeDef, visitorContext) => {
  const problems = []
  if (!typeDef.name) {
    problems.push(error('Missing type name'))
  } else if (visitorContext.isReserved(typeDef.name)) {
    problems.push(error(`Invalid type name: "${typeDef.name}" is reserved`))
  }

  if (visitorContext.isDuplicate(typeDef.name)) {
    problems.push(error(`Invalid type name: A type with name "${typeDef.name}" is already defined.`))
  }

  if (!('title' in typeDef)) {
    problems.push(warning(
      'Type is missing title. It\'s recommended to always set a descriptive title',
      'schema-type-invalid-or-missing-attr-title'
    ))
  } else if (typeof typeDef.title !== 'string') {
    problems.push(warning(
      'Type title is not a string.',
      'schema-type-invalid-or-missing-attr-title'
    ))
  }
  return {
    ...typeDef,
    _problems: problems
  }
}
