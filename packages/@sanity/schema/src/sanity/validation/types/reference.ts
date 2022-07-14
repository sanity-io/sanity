import {error, HELP_IDS} from '../createValidationResult'
import {flatten, isPlainObject} from 'lodash'
import {getDupes} from '../utils/getDupes'
import {SchemaValidationResult} from '../../typedefs'

function normalizeToProp(typeDef) {
  if (Array.isArray(typeDef.to)) {
    return typeDef.to
  }
  return typeDef.to ? [typeDef.to] : typeDef.to
}

export default (typeDef, visitorContext) => {
  const isValidTo = Array.isArray(typeDef.to) || isPlainObject(typeDef.to)
  const normalizedTo = normalizeToProp(typeDef)

  const problems = flatten([
    isValidTo
      ? getDupes(normalizedTo, (t) => `${t.name};${t.type}`).map((dupes) =>
          error(
            `Found ${dupes.length} members with same type, but not unique names "${dupes[0].type}" in reference. This makes it impossible to tell their values apart and you should consider naming them`,
            HELP_IDS.REFERENCE_TO_INVALID
          )
        )
      : error(
          'The reference type is missing or having an invalid value for the required "to" property. It should be an array of accepted types.',
          HELP_IDS.REFERENCE_TO_INVALID
        ),
  ])

  if (isValidTo && normalizedTo.length === 0) {
    problems.push(
      error(
        'The reference type should define at least one accepted type. Please check the "to" property.',
        HELP_IDS.REFERENCE_TO_INVALID
      )
    )
  }

  problems.push(...getOptionErrors(typeDef))

  return {
    ...typeDef,
    to: (isValidTo ? normalizedTo : []).map(visitorContext.visit),
    _problems: problems,
  }
}

function getOptionErrors(typeDef: any): SchemaValidationResult[] {
  const {options} = typeDef
  const problems = [] as SchemaValidationResult[]

  problems.push(
    ...['filter', 'filterParams']
      .filter((key) => key in typeDef)
      .map((key) =>
        error(
          `\`${key}\` is not allowed on a reference type definition - did you mean \`options.${key}\`?`,
          HELP_IDS.REFERENCE_INVALID_OPTIONS_LOCATION
        )
      )
  )

  if (!options) {
    return problems
  }

  if (!isPlainObject(options)) {
    return problems.concat(
      error(
        'The reference type expects `options` to be an object',
        HELP_IDS.REFERENCE_INVALID_OPTIONS
      )
    )
  }

  if (typeof options.filter === 'function' && typeof options.filterParams !== 'undefined') {
    return problems.concat(
      error(
        '`filterParams` cannot be used if `filter` is a function. Either statically define `filter` as a string, or return `params` from the `filter`-function.',
        HELP_IDS.REFERENCE_INVALID_FILTER_PARAMS_COMBINATION
      )
    )
  }

  if (typeof options.filter === 'function' || (!options.filter && !options.filterParams)) {
    return problems
  }

  if (typeof options.filter !== 'string') {
    return problems.concat(
      error(`If set, \`filter\` must be a string. Got ${typeof options.filter}`)
    )
  }

  if (typeof options.filterParams !== 'undefined' && !isPlainObject(options.filterParams)) {
    return problems.concat(error(`If set, \`filterParams\` must be an object.`))
  }

  if (options.filterParams) {
    return problems.concat(
      Object.keys(options.filterParams)
        .filter((key) => key.startsWith('__') || key.startsWith('$'))
        .map((key) => error(`Filter parameter cannot be prefixed with "$" or "__". Got ${key}".`))
    )
  }

  return problems
}
