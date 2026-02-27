import {type ConditionalProperty, type CurrentUser, type Path} from '@sanity/types'

/**
 * @internal
 */
export interface ConditionalPropertyCallbackContext {
  parent?: unknown
  document?: Record<string, unknown>
  currentUser: Omit<CurrentUser, 'role'> | null
  value: unknown
  path: Path
}

/**
 * @internal
 */
export function resolveConditionalProperty(
  property: ConditionalProperty,
  context: ConditionalPropertyCallbackContext,
) {
  const {currentUser, document, parent, value, path} = context

  if (typeof property === 'boolean' || property === undefined) {
    return Boolean(property)
  }

  return (
    // oxlint-disable-next-line no-unnecessary-boolean-literal-compare - we can't trust the return value here is actually a boolean at runtime
    property({
      document: document as any,
      parent,
      value,
      currentUser,
      path,
    }) === true // note: we can't strictly "trust" the return value here, so the conditional property should probably be typed as unknown
  )
}
