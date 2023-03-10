/* eslint-disable no-nested-ternary */
import {ConditionalProperty, CurrentUser} from '@sanity/types'
import {Workspace} from '../../../config'

export interface ConditionalPropertyCallbackContext {
  parent?: unknown
  document?: Record<string, unknown>
  currentUser: Omit<CurrentUser, 'role'> | null
  value: unknown
  workspace: Workspace
}

export function resolveConditionalProperty(
  property: ConditionalProperty,
  context: ConditionalPropertyCallbackContext
) {
  const {currentUser, document, parent, value, workspace} = context

  if (typeof property === 'boolean' || property === undefined) {
    return Boolean(property)
  }

  return (
    property({
      document: document as any,
      parent,
      value,
      currentUser,
      workspace,
    }) === true // note: we can't strictly "trust" the return value here, so the conditional property should probably be typed as unknown
  )
}
