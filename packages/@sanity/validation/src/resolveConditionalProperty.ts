import {type ConditionalProperty, type CurrentUser, type Path} from '@sanity/types'

interface ConditionalPropertyCallbackContext {
  parent?: unknown
  document?: Record<string, unknown>
  currentUser: Omit<CurrentUser, 'role'> | null
  value: unknown
  path: Path
}

export function resolveConditionalProperty(
  property: ConditionalProperty,
  context: ConditionalPropertyCallbackContext,
) {
  const {currentUser, document, parent, value, path} = context

  if (typeof property === 'boolean' || property === undefined) return Boolean(property)

  // oxlint-disable-next-line no-unnecessary-boolean-literal-compare -- runtime callbacks may return non-booleans
  return property({document: document as never, parent, value, currentUser, path}) === true
}
