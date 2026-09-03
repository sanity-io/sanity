import {Container, type ContainerProps, rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ReactNode, type RefAttributes} from 'react'

import {popoverContainer, widthVars} from './PopoverContainer.css'

interface PopoverContainerProps extends ContainerProps {
  children: ReactNode
}

// This is a workaround to make sure that the Container gets the correct width when used inside a popover.
// The default Container uses `maxWidth` which doesn't work well with popovers because the popover
// calculates its width based on the content width.
export function PopoverContainer(props: PopoverContainerProps & RefAttributes<HTMLDivElement>) {
  const {className, ref, style, width = [], ...restProps} = props
  const {container} = useThemeV2()
  const widths = Array.isArray(width) ? width : [width]

  const vars: Record<string, string> = {}
  widths.forEach((val, index) => {
    const widthVar = widthVars[index]
    if (!widthVar) return
    // `'auto'` used to emit `width: none`, which is invalid CSS and was dropped by the browser,
    // leaving Container's own `width: 100%` in effect. A custom property cannot be dropped that
    // way, so set the value the cascade ended up with.
    vars[widthVar] = val === 'auto' ? '100%' : `${rem(container[val])}`
  })

  return (
    <Container
      {...restProps}
      data-ui="PopoverContainer"
      className={clsx(widths.length > 0 && popoverContainer, className)}
      style={{...assignInlineVars(vars), ...style}}
      ref={ref}
    />
  )
}
