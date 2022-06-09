import React, {forwardRef} from 'react'
import {useStateLink} from './useStateLink'

/**
 * @public
 */
export interface StateLinkProps {
  replace?: boolean
  state?: Record<string, unknown>
  toIndex?: boolean
}

/**
 * @public
 */
export const StateLink = forwardRef(function StateLink(
  props: StateLinkProps & Omit<React.HTMLProps<HTMLAnchorElement>, 'href'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {onClick, replace, state, target, toIndex = false, ...restProps} = props
  const {handleClick, href} = useStateLink({onClick, replace, state, target, toIndex})

  return <a {...restProps} href={href} onClick={handleClick} ref={ref} />
})
