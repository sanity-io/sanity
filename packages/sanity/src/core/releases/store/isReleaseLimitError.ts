type ErrorWithDetails = {details?: {type?: string}}

const hasDetails = (error: unknown): error is ErrorWithDetails =>
  typeof error === 'object' &&
  error !== null &&
  'details' in error &&
  typeof (error as {details: unknown}).details === 'object'

export const isReleaseLimitError = (error: Error): boolean =>
  hasDetails(error) && error.details?.type === 'releaseLimitExceededError'
