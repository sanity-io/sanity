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
      globalDocumentReference: unsupportedTypeValidator('global document reference'),
    }),
  })

  const validation = groupProblems(validated.getTypes())

  const errors = validation
    .map((group) => group.problems.filter(({severity}) => severity === 'error'))
    .filter((problems) => problems.length)

  return [errors.length === 0, errors]
}
