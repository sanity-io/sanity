/* eslint-disable no-nested-ternary */
import {ConditionalProperty, CurrentUser, Path} from '@sanity/types'

export interface ConditionalPropertyCallbackContext {
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

  if (typeof property === 'boolean' || property === undefined) {
    return Boolean(property)
  }

  return (
    property({
      document: document as any,
      parent,
      value,
      currentUser,
      path,
    }) === true // note: we can't strictly "trust" the return value here, so the conditional property should probably be typed as unknown
  )
}
