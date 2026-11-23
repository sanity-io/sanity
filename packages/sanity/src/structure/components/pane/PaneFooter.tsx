import {type ReactNode, type RefAttributes} from 'react'
import {LegacyLayerProvider} from 'sanity'
import {Box, type PaddingProps} from 'ui5'

import {Root, RootCard} from './PaneFooter.styles'
import {usePane} from './usePane'

interface PaneFooterProps {
  children?: ReactNode
  padding?: PaddingProps['padding']
  [dataAttribute: `data-${string}`]: string | undefined
}

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export function PaneFooter(props: PaneFooterProps & RefAttributes<HTMLDivElement>) {
  const {ref, children, padding, ...dataAttributes} = props
  const {collapsed} = usePane()

  return (
    <LegacyLayerProvider zOffset="paneFooter">
      <Root data-testid="pane-footer" {...dataAttributes} hidden={collapsed} ref={ref}>
        <RootCard tone="inherit">
          <Box padding={padding}>{children}</Box>
        </RootCard>
      </Root>
    </LegacyLayerProvider>
  )
}
