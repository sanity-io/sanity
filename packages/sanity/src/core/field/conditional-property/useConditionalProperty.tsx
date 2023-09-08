import {SanityDocument, ConditionalProperty, Path} from '@sanity/types'
import {useCurrentUser} from '../../store'
import {useUnique} from '../../util'
import {useCheckCondition} from './utils'

/**
 * @internal Not yet a stable API
 */
export interface ConditionalPropertyProps {
  parent?: unknown
  value: unknown
  document?: SanityDocument
  path: Path
  checkProperty: ConditionalProperty
  checkPropertyKey: string
}

/**
 * Resolve a callback function to a boolean using the passed arguments
 *
 * @internal Not yet a stable API
 */
const useConditionalProperty = (props: ConditionalPropertyProps): boolean => {
  const {checkProperty = false, checkPropertyKey, document, parent, value: valueProp, path} = props
  const value = useUnique(valueProp)
  const currentUser = useCurrentUser()

  const isPropertyTruthy = useCheckCondition(checkProperty, checkPropertyKey, {
    currentUser,
    document,
    parent,
    value,
    path,
  })

  return isPropertyTruthy
}

export {useConditionalProperty as unstable_useConditionalProperty}
