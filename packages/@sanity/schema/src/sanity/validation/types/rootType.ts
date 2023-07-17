import {error, HELP_IDS, warning} from '../createValidationResult'
import {validateComponent} from '../utils/validateComponent'

export default (typeDef, visitorContext) => {
  const hasName = Boolean(typeDef.name)
  if (!hasName && Object.keys(typeDef).length === 1) {
    // Short-circuit on obviously invalid types (only key is _problems)
    return {
      ...typeDef,
      _problems: [
        error(
          'Invalid/undefined type declaration, check declaration or the import/export of the schema type.',
          HELP_IDS.TYPE_INVALID
        ),
      ],
    }
  }

  const problems = []
  if (looksLikeEsmModule(typeDef)) {
    problems.push(
      error(
        'Type appears to be an ES6 module imported through CommonJS require - use an import statement or access the `.default` property',
        HELP_IDS.TYPE_IS_ESM_MODULE
      )
    )
  } else if (!hasName) {
    problems.push(error('Missing type name', HELP_IDS.TYPE_MISSING_NAME))
  } else if (visitorContext.isReserved(typeDef.name)) {
    problems.push(
      error(`Invalid type name: "${typeDef.name}" is a reserved name.`, HELP_IDS.TYPE_NAME_RESERVED)
    )
  }

  if (visitorContext.isDuplicate(typeDef.name)) {
    problems.push(
      error(
        `Invalid type name: A type with name "${typeDef.name}" is already defined in the schema.`
      )
    )
  }

  problems.push(...validateComponent(typeDef))

  if ('title' in typeDef && typeof typeDef.title !== 'string') {
    problems.push(warning('Type title is not a string.', HELP_IDS.TYPE_TITLE_INVALID))
  }
  return {
    ...typeDef,
    _problems: problems,
  }
}

function looksLikeEsmModule(typeDef) {
  return !typeDef.name && typeDef.default && (typeDef.default.name || typeDef.default.title)
}
