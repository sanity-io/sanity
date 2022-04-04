import React, {forwardRef} from 'react'
import {useLink} from './useLink'

/**
 * @public
 */
export interface LinkProps {
  replace?: boolean
}

/**
 * @public
 */
export const Link = forwardRef(function Link(
  props: LinkProps & React.HTMLProps<HTMLAnchorElement>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {onClick, href, target, replace, ...restProps} = props
  const {handleClick} = useLink({onClick, href, target, replace})

  return <a {...restProps} onClick={handleClick} href={href} target={target} ref={ref} />
})
