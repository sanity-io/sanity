type ErrorWithDetails = {details?: {type?: string}}

export const isErrorWithDetails = (error: unknown): error is ErrorWithDetails =>
  typeof error === 'object' &&
  error !== null &&
  'details' in error &&
  typeof (error as {details: unknown}).details === 'object'
