type ErrorWithDetails = {details?: {type?: string}}
type ReleaseLimitError = {details: {type: 'releaseLimitExceededError'; limit: number}}

const hasDetails = (error: unknown): error is ErrorWithDetails =>
  typeof error === 'object' &&
  error !== null &&
  'details' in error &&
  typeof (error as {details: unknown}).details === 'object'

export const isReleaseLimitError = (error: unknown): error is ReleaseLimitError =>
  hasDetails(error) && error.details?.type === 'releaseLimitExceededError'
