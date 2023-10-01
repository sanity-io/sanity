/**
 * Represents an error specific to timeline operations or contexts. The error
 * attempts to extract a meaningful message from its cause, defaulting to
 * "Unknown error" if one isn't found.
 *
 * The `cause` property holds the original error
 * @internal
 */
export class TimelineError extends Error {
  constructor(public cause: unknown) {
    const messageFromCause =
      typeof cause === 'object' && cause && 'message' in cause && typeof cause.message === 'string'
        ? cause.message
        : 'Unknown error'

    super(`TimelineError: ${messageFromCause}`)
  }
}
