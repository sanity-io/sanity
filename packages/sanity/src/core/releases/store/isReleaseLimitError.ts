import {isErrorWithDetails} from '../../error/types/isErrorWithDetails'

type ReleaseLimitError = {details: {type: 'releaseLimitExceededError'; limit: number}}

export const isReleaseLimitError = (error: unknown): error is ReleaseLimitError =>
  isErrorWithDetails(error) && error.details?.type === 'releaseLimitExceededError'
