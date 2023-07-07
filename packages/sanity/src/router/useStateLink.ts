import React, {useMemo} from 'react'
import {useRouter} from './useRouter'
import {useLink} from './useLink'

const EMPTY_STATE = {}

/**
 * @public
 */
export interface UseStateLinkOptions {
  /**
   * The click event handler for the link.
   */
  onClick?: React.MouseEventHandler<HTMLElement>
  /**
   * Whether to replace the current history entry instead of adding a new one.
   */
  replace?: boolean
  /**
   * The state object to update when the link is clicked.
   */
  state?: Record<string, unknown>
  /**
   * The target window or frame to open the linked document in.
   */
  target?: string
  /**
   * Whether to navigate to the index page of the linked document.
   */
  toIndex?: boolean
}

/**
 * @public
 *
 * @param options - Options to use for the link
 *  {@link UseStateLinkOptions}
 *
 * @returns - An object with `onClick` and `href` props to use for the link
 *
 * @example
 * ```tsx
 * const {onClick, href} = useStateLink({state: {foo: 'bar'}})
 * ```
 */
export function useStateLink(options: UseStateLinkOptions): {
  onClick: React.MouseEventHandler<HTMLElement>
  href: string
} {
  const {onClick: onClickProp, replace, state, target, toIndex = false} = options

  if (state && toIndex) {
    throw new Error('Passing both `state` and `toIndex={true}` as props to StateLink is invalid')
  }

  if (!state && !toIndex) {
    // eslint-disable-next-line no-console
    console.error(
      new Error(
        'No state passed to StateLink. If you want to link to an empty state, its better to use the the `toIndex` property'
      )
    )
  }

  const {resolvePathFromState} = useRouter()

  const href = useMemo(
    () => resolvePathFromState(toIndex ? EMPTY_STATE : state || EMPTY_STATE),
    [resolvePathFromState, state, toIndex]
  )

  const {onClick} = useLink({href, onClick: onClickProp, replace, target})

  return {onClick, href}
}
