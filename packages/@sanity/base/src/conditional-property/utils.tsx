import {ConditionalProperty, ConditionalPropertyCallbackContext, CurrentUser} from '@sanity/types'
import {useMemo, useRef} from 'react'

export function isThenable(value: any) {
  return typeof value?.then === 'function'
}

export function omitDeprecatedRole(user: CurrentUser): Omit<CurrentUser, 'role'> {
  if (user?.role) {
    const {role, ...rest} = user
    return rest
  }
  return user
}

export function useCheckCondition(
  checkProperty: ConditionalProperty,
  checkPropertyName: string,
  {document, parent, value, currentUser}: ConditionalPropertyCallbackContext
) {
  const didWarn = useRef(false)
  return useMemo(() => {
    let isTrueIsh = false

    if (typeof checkProperty === 'boolean') {
      return checkProperty
    }

    try {
      isTrueIsh = checkProperty({
        document,
        parent,
        value,
        currentUser,
      })
    } catch (err) {
      console.error(
        `An error occurred while running the callback from \`${checkPropertyName}\`: ${err.message}`
      )
      return false
    }
    if (isThenable(isTrueIsh) && !didWarn.current) {
      console.warn(
        `The \`${checkPropertyName}\` option is either a promise or a promise returning function. Async callbacks for \`${checkPropertyName}\` option is not currently supported.`
      )
      return false
    }
    if (typeof isTrueIsh === 'undefined') {
      console.warn(
        `The \`${checkPropertyName}\` option is either a promise or a promise returning function. Async callbacks for \`${checkPropertyName}\` option is not currently supported.`
      )
    }
    return isTrueIsh
  }, [checkProperty, document, parent, value, currentUser, checkPropertyName])
}
