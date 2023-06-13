import React, {forwardRef} from 'react'
import {useLink} from './useLink'

/**
 * The props for the `Link` component that creates an HTML anchor element.
 *
 * @public
 */
export interface LinkProps {
  /**
   * Whether to replace the current URL in the browser history instead of adding a new entry.
   */
  replace?: boolean
}

/**
 * A component that creates an HTML anchor element.
 *
 * @public
 *
 * @param props - Props to pass to the anchor element.
 *  {@link LinkProps}
 * @param ref - A ref to the anchor element.
 *
 * @returns The created anchor element.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   return (
 *    <Link href="https://www.sanity.io" target="_blank" replace>
 *      Go to Sanity
 *    </Link>
 *   )
 * }
 * ```
 */
export const Link = forwardRef(function Link(
  props: LinkProps & React.HTMLProps<HTMLAnchorElement>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  const {onClick: onClickProp, href, target, replace, ...restProps} = props
  const {onClick} = useLink({onClick: onClickProp, href, target, replace})

  return <a {...restProps} onClick={onClick} href={href} target={target} ref={ref} />
})
