import {Box} from '@sanity/ui'
import React, {forwardRef} from 'react'
import {usePane} from './usePane'
import {Root, RootCard} from './PaneFooter.styles'
import {LegacyLayerProvider} from 'sanity'

interface PaneFooterProps {
  children?: React.ReactNode
  padding?: number | number[]
}

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export const PaneFooter = forwardRef(function PaneFooter(
  props: PaneFooterProps,
  ref: React.ForwardedRef<HTMLDivElement>
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
