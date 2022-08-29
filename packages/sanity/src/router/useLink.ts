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
export function useLink(props: {
  href?: string
  onClick?: React.MouseEventHandler<HTMLElement>
  replace?: boolean
  target?: string
}): {onClick: React.MouseEventHandler<HTMLElement>} {
  const {onClick: onClickProp, href, target, replace = false} = props
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
