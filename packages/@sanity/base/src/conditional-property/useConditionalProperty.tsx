/* eslint-disable react-hooks/rules-of-hooks */
import {SanityDocument, ConditionalProperty} from '@sanity/types'
import {useCurrentUser} from '../_exports/hooks'
import {omitDeprecatedRole, useCheckCondition} from './utils'

/**
 * Resolve a callback function to a boolean using the passed arguments
 *
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 * @internal Not a stable API yet
 */

export interface ConditionalPropertyProps {
  parent?: unknown
  value: unknown
  document: SanityDocument
  checkProperty: ConditionalProperty
  checkPropertyKey: string
}

// eslint-disable-next-line camelcase
export const unstable_useConditionalProperty = ({
  checkProperty,
  ...props
}: ConditionalPropertyProps): boolean => {
  if (typeof checkProperty === 'function') {
    return resolveProperty({checkProperty, ...props})
  }
  return checkProperty
}

function resolveProperty({
  checkProperty,
  checkPropertyKey,
  document,
  parent,
  value,
}: ConditionalPropertyProps): boolean {
  const {value: currentUser} = useCurrentUser()
  const isPropertyTruthy = useCheckCondition(checkProperty, checkPropertyKey, {
    currentUser: omitDeprecatedRole(currentUser),
    document,
    parent,
    value,
  })

  return isPropertyTruthy
}
