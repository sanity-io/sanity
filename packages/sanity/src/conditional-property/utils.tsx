import {ConditionalProperty, ConditionalPropertyCallbackContext, CurrentUser} from '@sanity/types'
import {omit} from 'lodash'
import {useMemo, useRef} from 'react'
import {isRecord} from '../util/isRecord'

export function isThenable(value: unknown): value is Promise<unknown> {
  return isRecord(value) && typeof value?.then === 'function'
}

export function omitDeprecatedRole(user: CurrentUser): Omit<CurrentUser, 'role'> {
  return omit(user, 'role')
}

export function useCheckCondition(
  checkProperty: ConditionalProperty,
  checkPropertyName: string,
  context: ConditionalPropertyCallbackContext
): boolean {
  const {currentUser, document, parent, value} = context

  const didWarn = useRef(false)

  return useMemo(() => {
    let isTrueIsh = false

    if (typeof checkProperty === 'boolean' || checkProperty === undefined) {
      return checkProperty || false
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
        `The \`${checkPropertyName}\` option is or returned \`undefined\`. \`${checkPropertyName}\` should return a boolean.`
      )
    }

    return isTrueIsh
  }, [checkProperty, document, parent, value, currentUser, checkPropertyName])
}
