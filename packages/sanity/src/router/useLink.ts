import {useCallback} from 'react'
import {useRouter} from './useRouter'

function isLeftClickEvent(event: React.MouseEvent) {
  return event.button === 0
}

function isModifiedEvent(event: React.MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

/**
 * @public
 */
export interface UseLinkOptions {
  /**
   * The URL that the link should navigate to.
   */
  href?: string

  /**
   * The event handler function that should be called when the link is clicked.
   */
  onClick?: React.MouseEventHandler<HTMLElement>

  /**
   * Whether the link should replace the current URL in the browser history.
   */
  replace?: boolean

  /**
   * The target window or frame that the linked document will open in.
   */
  target?: string
}

/**
 * Returns an object with an `onClick` function that can be used as a click handler for a link.
 *
 * @public
 *
 * @param options - An object containing the properties for the link.
 *  See {@link UseLinkOptions}
 *
 * @returns An object with an `onClick` function.
 *
 * @example
 * ```tsx
 * const linkProps = useLink({
 *  href: 'https://www.sanity.io',
 *  target: '_blank'
 * })
 *
 * <a {...linkProps}>Link</a>
 * ```
 */
export function useLink(options: UseLinkOptions): {onClick: React.MouseEventHandler<HTMLElement>} {
  const {onClick: onClickProp, href, target, replace = false} = options
  const {navigateUrl} = useRouter()

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLElement>): void => {
      if (event.isDefaultPrevented()) {
        return
      }

      if (!href) return

      if (onClickProp) {
        onClickProp(event)
      }

      if (isModifiedEvent(event) || !isLeftClickEvent(event)) {
        return
      }

      // If target prop is set (e.g. to "_blank") let browser handle link.
      if (target) {
        return
      }

      event.preventDefault()

      navigateUrl({path: href, replace})
    },
    [href, navigateUrl, onClickProp, replace, target]
  )

  return {onClick: onClick}
}
