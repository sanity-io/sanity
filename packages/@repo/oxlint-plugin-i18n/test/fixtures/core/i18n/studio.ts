// Stands in for `defineLocalesResources` from `sanity`, which returns the strings as is
function defineLocalesResources<T>(_namespace: string, strings: T): T {
  return strings
}

export const studioLocaleStrings = defineLocalesResources('studio', {
  'changes.close-label': 'Close history',
  'documents.count_one': '{{count}} document',
  'documents.count_other': '{{count}} documents',
  'presence.tooltip.one': '{{displayName}} is editing this document right now',
} as const)
