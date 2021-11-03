import {SanityDocument, ConditionalProperty} from '@sanity/types'
import {useCurrentUser} from '../_exports/hooks'
import {omitDeprecatedRole, useCheckCondition} from './utils'

export interface ConditionalPropertyProps {
  parent?: Record<string, unknown> | undefined
  value: unknown
  document: SanityDocument
  checkProperty: ConditionalProperty
  checkPropertyKey: string
}

export const useResolveConditionalProperty = (props: ConditionalPropertyProps) => {
  const {document, parent, value, checkProperty, checkPropertyKey} = props

  const {value: currentUser} = useCurrentUser()
  const isPropertyTruthy = useCheckCondition(checkProperty, checkPropertyKey, {
    currentUser: omitDeprecatedRole(currentUser),
    document,
    parent,
    value,
  })

  return isPropertyTruthy
}
