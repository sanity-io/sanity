import {warning, HELP_IDS} from '../createValidationResult'

export default (typeDef, visitorContext) => {
  const problems = []

  if (typeDef.options && typeDef.options.slugifyFn) {
    problems.push(
      warning(
        'Heads up! The "slugifyFn" option has been renamed to "slugify".',
        HELP_IDS.SLUG_SLUGIFY_FN_RENAMED
      )
    )

    typeDef.options.slugify = typeDef.options.slugifyFn
  }

  return {
    ...typeDef,
    _problems: problems,
  }
}
