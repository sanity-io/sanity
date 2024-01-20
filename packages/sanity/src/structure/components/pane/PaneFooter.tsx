import {Box} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type ReactNode} from 'react'
import {LegacyLayerProvider} from 'sanity'

import {Root, RootCard} from './PaneFooter.styles'
import {usePane} from './usePane'

interface PaneFooterProps {
  children?: ReactNode
  padding?: number | number[]
}

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export const PaneFooter = forwardRef(function PaneFooter(
  props: PaneFooterProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {children, padding} = props
  const {collapsed} = usePane()

  return (
    <LegacyLayerProvider zOffset="paneFooter">
      <Root data-testid="pane-footer" hidden={collapsed} ref={ref}>
        <RootCard tone="inherit">
          <Box padding={padding}>{children}</Box>
        </RootCard>
      </Root>
    </LegacyLayerProvider>
  )
})
