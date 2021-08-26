import React, {ForwardedRef, forwardRef, MouseEvent, useCallback, useContext} from 'react'
import {RouterContext} from '../RouterContext'

function isLeftClickEvent(event: MouseEvent) {
  return event.button === 0
}

function isModifiedEvent(event: MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

interface LinkProps {
  replace?: boolean
}
const Link = forwardRef(function Link(
  props: LinkProps & React.HTMLProps<HTMLAnchorElement>,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  const routerContext = useContext(RouterContext)
  const {onClick, href, target, replace = false, ...rest} = props

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>): void => {
      if (!routerContext) throw new Error('Link: missing context value')

      if (!routerContext) {
        return
      }

      if (event.isDefaultPrevented()) {
        return
      }

      if (!href) return

      if (onClick) {
        onClick(event)
      }

      if (isModifiedEvent(event) || !isLeftClickEvent(event)) {
        return
      }

      // If target prop is set (e.g. to "_blank") let browser handle link.
      if (target) {
        return
      }

      event.preventDefault()

      routerContext.navigateUrl(href, {replace})
    },
    [href, onClick, replace, routerContext, target]
  )

  return <a {...rest} onClick={handleClick} href={href} target={target} ref={ref} />
})

export default Link
