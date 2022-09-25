import {ConfigResolutionError, ConfigPropertyError} from '../../config'
import {isRecord} from '../../util'
import {ErrorMessageProps} from './ErrorMessage'

export function flattenErrors(
  error: unknown,
  path: Array<{name: string; type: string}>
): ErrorMessageProps[] {
  if (error instanceof ConfigResolutionError) {
    return error.causes.flatMap((cause) =>
      flattenErrors(cause, [...path, {name: error.name, type: error.type}])
    )
  }

  if (error instanceof ConfigPropertyError) {
    return flattenErrors(error.cause, [
      ...path,
      ...error.path.slice(1).map((name) => ({name, type: 'plugin'})),
      {name: error.propertyName, type: 'property'},
    ])
  }

  const message =
    isRecord(error) && typeof error.message === 'string' ? error.message : 'Unknown error'
  const stack = isRecord(error) && typeof error.stack === 'string' ? error.stack : undefined

  return [
    {
      message,
      stack,
      error,
      path,
    },
  ]
}
