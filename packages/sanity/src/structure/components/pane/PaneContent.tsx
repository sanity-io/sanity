import {type BoxOverflow} from '@sanity/ui'
import {type ElementType, type ForwardedRef, forwardRef, type HTMLProps} from 'react'

import {Root} from './PaneContent.styles'
import {usePane} from './usePane'
import {usePaneLayout} from './usePaneLayout'

interface PaneContentProps {
  as?: ElementType | keyof React.JSX.IntrinsicElements
  overflow?: BoxOverflow
  padding?: number | number[]
}

/**
 * @hidden
 * @internal
 */
export const PaneContent = forwardRef(function PaneContent(
  props: PaneContentProps & Omit<HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>,
  ref: ForwardedRef<HTMLDivElement>,
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
