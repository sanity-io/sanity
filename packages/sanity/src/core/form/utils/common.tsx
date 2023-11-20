import {ConditionalProperty, ConditionalPropertyCallbackContext, CurrentUser} from '@sanity/types'
import React, {useMemo} from 'react'

export function isThenable(value: any) {
  return typeof value?.then === 'function'
}

const warningMap = new Map<string, boolean>()

export function isTrueIsh(
  checkProperty: ConditionalProperty,
  checkPropertyName: string,
  {document, parent, value, currentUser}: ConditionalPropertyCallbackContext,
) {
  let result = false

  if (typeof checkProperty === 'boolean' || !checkProperty) {
    return checkProperty
  }

  try {
    result = checkProperty({
      document,
      parent,
      value,
      currentUser,
      path,
    })
  } catch (err) {
    console.error(
      `An error occurred while running the callback from \`${checkPropertyName}\`: ${err.message}`,
    )
    return false
  }
  if (isThenable(result) && !warningMap.has(checkPropertyName)) {
    warningMap.set(checkPropertyName, true)
    console.warn(
      `The \`${checkPropertyName}\` option is either a promise or a promise returning function. Async callbacks for \`${checkPropertyName}\` option is not currently supported.`,
    )
    return false
  }
  if (typeof result === 'undefined' && !warningMap.has(checkPropertyName)) {
    warningMap.set(checkPropertyName, true)
    console.warn(
      `The \`${checkPropertyName}\` option is either a promise or a promise returning function. Async callbacks for \`${checkPropertyName}\` option is not currently supported.`,
    )
  }
  return result
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
  context: ConditionalPropertyCallbackContext,
) {
  return useMemo(() => {
    return isTrueIsh(checkProperty, checkPropertyName, context)
  }, [checkProperty, checkPropertyName, context])
}

type ChildrenWithPropsProps = {
  children: React.ReactNode | React.ReactNode[]
  childProps: Record<string, unknown>
}

export function mappedChildren({children, childProps}: ChildrenWithPropsProps) {
  if (!Array.isArray(children)) {
    children = [children]
  }
  return React.Children.map(children, function (child) {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, childProps)
    }
    return child
  })
}
