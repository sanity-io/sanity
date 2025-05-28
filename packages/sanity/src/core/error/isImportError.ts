const MESSAGES = [
  // chromium
  'Failed to fetch dynamically imported module:',
  // safari
  'Importing a module script failed.',
  // firefox
  'error loading dynamically imported module',
]

/**
 * Checks whether an error is caused by a failed dynamic import
 * Note: this is best effort, based on matching the error string and should not be trusted for critical stuff
 * @param error - {@link Error} the error to test
 */
export function isImportError(error: Error) {
  return (
    error.name === 'TypeError' &&
    MESSAGES.some((msg) => error.message.toLowerCase().startsWith(msg.toLowerCase()))
  )
}
