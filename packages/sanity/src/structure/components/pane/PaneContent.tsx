import {BoxOverflow} from '@sanity/ui'
import React, {forwardRef} from 'react'
import {usePane} from './usePane'
import {usePaneLayout} from './usePaneLayout'
import {Root} from './PaneContent.styles'

interface PaneContentProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  overflow?: BoxOverflow
  padding?: number | number[]
}

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export const PaneContent = forwardRef(function PaneContent(
  props: PaneContentProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {as, children, overflow, padding, ...restProps} = props
  const {collapsed} = usePane()
  const {collapsed: layoutCollapsed} = usePaneLayout()

  return (
    <Root
      data-testid="pane-content"
      forwardedAs={as}
      {...restProps}
      flex={1}
      hidden={collapsed}
      overflow={layoutCollapsed ? undefined : overflow}
      padding={padding}
      ref={ref}
      tone="inherit"
    >
      {children}
    </Root>
  )
})
