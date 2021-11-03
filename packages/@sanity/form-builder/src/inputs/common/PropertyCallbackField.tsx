import {type} from 'os'
import React, {forwardRef, useMemo, useRef} from 'react'
import {
  ConditionalOption,
  ConditionalOptionCallbackContext,
  ConditionalOptionCallback,
  SanityDocument,
  CurrentUser,
} from '@sanity/types'

import {useCurrentUser} from '@sanity/base/hooks'
import withDocument from '../../utils/withDocument'

function isThenable(value: any) {
  return typeof value?.then === 'function'
}

function omitDeprecatedRole(user: CurrentUser): Omit<CurrentUser, 'role'> {
  const {role, ...rest} = user
  return rest
}

function useCheckCondition(
  checkProperty: ConditionalOption,
  checkPropertyName: string,
  {document, parent, value, currentUser}: ConditionalOptionCallbackContext
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
        `The hidden option is either a promise or a promise returning function. Async callbacks for \`${checkPropertyName}\` option is not currently supported.`
      )
      return false
    }
    if (typeof isTrueIsh === 'undefined') {
      console.warn(
        `The hidden option is either a promise or a promise returning function. Async callbacks for \`${checkPropertyName}\` option is not currently supported.`
      )
    }
    return isTrueIsh
  }, [checkProperty, document, parent, value, currentUser])
}

interface Props {
  checkProperty: ConditionalOption
  checkPropertyKey: string
  parent: Record<string, unknown> | undefined
  value: unknown
  children?: React.ReactNode | React.ReactNode[]
}

export const PropertyCallbackField = ({checkProperty, checkPropertyKey, ...rest}: Props) => {
  return typeof checkProperty === 'function' ? (
    <PropertyCallbackFieldWithDocument
      {...rest}
      checkProperty={checkProperty}
      checkPropertyKey={checkPropertyKey}
    />
  ) : (
    <>{rest.children}</>
  )
}

type ChildrenWithPropsProps = {
  children: React.ReactNode | React.ReactNode[]
  childProps: Record<string, unknown>
}

function mappedChildren({children, childProps}: ChildrenWithPropsProps) {
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

const PropertyCallbackFieldWithDocument = withDocument(
  forwardRef(function PropertyCallbackFieldWithDocument(
    props: Omit<Props, 'hidden' | 'readOnly' | 'type'> & {
      document: SanityDocument
      checkProperty?: ConditionalOption
      checkPropertyKey?: string
    },
    ref /* ignore ref as there's no place to put it */
  ) {
    const {document, parent, value, checkProperty, checkPropertyKey, children} = props
    const {value: currentUser} = useCurrentUser()
    const isPropertyTrueIsh = useCheckCondition(checkProperty, checkPropertyKey, {
      currentUser: omitDeprecatedRole(currentUser),
      document,
      parent,
      value,
    })

    return <>{mappedChildren({children, childProps: {[checkPropertyKey]: isPropertyTrueIsh}})}</>
  })
)
