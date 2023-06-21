import React, {forwardRef} from 'react'
import {useStateLink} from './useStateLink'

/**
 * @public
 */
export interface StateLinkProps {
  /**
   * Whether to replace the current history entry instead of adding a new one.
   */
  replace?: boolean
  /**
   * The state to associate with the link.
   */
  state?: Record<string, unknown>
  /**
   * Whether to navigate to the index page of the app.
   */
  toIndex?: boolean
}

/**
 * A component that creates a link that updates the URL state.
 *
 * @remarks
 * This component uses the {@link useStateLink | `useStateLink`} hook to create a link that updates the URL state.
 *
 * @param props - The props for the component. See {@link StateLinkProps}.
 * @param ref - A React ref to forward to the underlying `a` element.
 *
 * @public
 * @returns A link that updates the URL state.
 */
export const StateLink = forwardRef(function StateLink(
  props: StateLinkProps & Omit<React.HTMLProps<HTMLAnchorElement>, 'href'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {onClick: onClickProp, replace, state, target, toIndex = false, ...restProps} = props
  const {onClick, href} = useStateLink({
    onClick: onClickProp,
    replace,
    state,
    target,
    toIndex,
  })

  return <a {...restProps} href={href} onClick={onClick} ref={ref} />
})
