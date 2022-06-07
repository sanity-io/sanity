/* eslint-disable no-nested-ternary */
import {ConditionalProperty, CurrentUser, SchemaType} from '@sanity/types'

import {omit} from 'lodash'

export type ConditionalPropertyName = 'hidden' | 'readOnly'

type Optional<T, K extends keyof T> = Omit<T, K> & Pick<Partial<T>, K>

export function omitDeprecatedRole(user: Optional<CurrentUser, 'role'>): Omit<CurrentUser, 'role'> {
  return omit(user, 'role')
}

interface SingleConditionalPropertyResult {
  hidden?: boolean | undefined
  readOnly?: boolean | undefined
}

export interface ConditionalPropertyCallbackContext {
  parent?: unknown
  document?: Record<string, unknown>
  currentUser: Omit<CurrentUser, 'role'> | null
  value: unknown
}

export function callConditionalProperties(
  type: SchemaType,
  ctx: ConditionalPropertyCallbackContext,
  properties: ConditionalPropertyName[]
): SingleConditionalPropertyResult {
  return properties.reduce((acc: SingleConditionalPropertyResult, propertyName) => {
    if (propertyName in type) {
      acc[propertyName] = callConditionalProperty(type[propertyName], ctx)
    }
    return acc
  }, {})
}

export function callConditionalProperty(
  property: ConditionalProperty,
  context: ConditionalPropertyCallbackContext
) {
  const {currentUser, document, parent, value} = context

  if (typeof property === 'boolean' || property === undefined) {
    return Boolean(property)
  }

  return (
    property({
      document: document as any,
      parent,
      value,
      currentUser,
    }) === true // note: we can't strictly "trust" the return value here, so the conditional property should probably be typed as unknown
  )
}
