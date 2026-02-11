/**
 * Safely extracts an error message from an unknown value that was thrown.
 * JavaScript allows throwing any value, not just Error instances.
 *
 * @param error - The unknown value that was thrown
 * @returns A string representation of the error
 * @internal
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
