import React, {forwardRef} from 'react'
import {useStateLink} from './useStateLink'

/**
 * Props for the {@link StateLink} component.
 *
 * @public
 */
export interface StateLinkProps {
  /**
   * Whether to replace the current history entry instead of adding a new one.
   */
  replace?: boolean
  /**
   * @internal
   */
  searchParams?: Record<string, string | undefined>
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
 * This component uses the {@link useStateLink} hook
 * to create a link that updates the URL state.
 *
 * @param props - Props to pass to the `StateLink` component.
 *  See {@link StateLinkProps}.
 *
 * @public
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *  return <StateLink state={{foo: 'bar'}}>Link</StateLink>
 * }
 * ```
 */
export const StateLink = forwardRef(function StateLink(
  props: StateLinkProps & Omit<React.HTMLProps<HTMLAnchorElement>, 'href'>,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const {
    onClick: onClickProp,
    replace,
    searchParams,
    state,
    target,
    toIndex = false,
    ...restProps
  } = props
  const {onClick, href} = useStateLink({
    onClick: onClickProp,
    replace,
    searchParams,
    state,
    target,
    toIndex,
  })

  return <a {...restProps} href={href} onClick={onClick} ref={ref} />
})
