// These strings are not internationalized because `ErrorActions` is used inside
// `StudioErrorBoundary`, which is rendered outside of `LocaleProvider`.
export const strings = {
  'retry.title': 'Retry',
  'copy-error-details.description': 'These technical details may be useful for developers.',
  'copy-error-details.title': 'Copy error details',
  'copy-error-details.toast.get-failed': 'Failed to get error details',
  'copy-error-details.toast.copy-failed': 'Failed to copy error details',
} as const
