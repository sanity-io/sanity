import {type SchemaValidationProblem} from '@sanity/types'

import {groupProblems} from './groupProblems'
import {validateSchema} from './validateSchema'

function unsupportedTypeValidator(typeLabel: string) {
  return function () {
    return {
      _problems: [
        {
          severity: 'error',
          message: `Type unsupported in Media Library aspects: ${typeLabel}.`,
        },
      ],
    }
  }
}

/**
 * Ensure that the provided value is a valid Media Library asset aspect that can be safely deployed.
 *
 * @internal
 */
export function validateMediaLibraryAssetAspect(
  maybeAspect: unknown,
): [isValidMediaLibraryAspect: boolean, validationErrors: SchemaValidationProblem[][]] {
  const input = [maybeAspect]

  const validated = validateSchema(input, {
    transformTypeVisitors: (typeVisitors) => ({
      ...typeVisitors,
      document: unsupportedTypeValidator('document'),
      image: unsupportedTypeValidator('image'),
      file: unsupportedTypeValidator('file'),
      reference: unsupportedTypeValidator('reference'),
      crossDatasetReference: unsupportedTypeValidator('cross dataset reference'),
    }),
  })

  const validation = groupProblems(validated.getTypes())

  const errors = validation
    .map((group) => group.problems.filter(({severity}) => severity === 'error'))
    .filter((problems) => problems.length)

  return [errors.length === 0, errors]
}
