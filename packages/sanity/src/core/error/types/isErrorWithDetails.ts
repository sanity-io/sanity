type ErrorWithDetails = {details?: {type?: string}}

export const isErrorWithDetails = (error: unknown): error is ErrorWithDetails =>
  typeof error === 'object' &&
  error !== null &&
  'details' in error &&
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  typeof (error as {details: unknown}).details === 'object'
