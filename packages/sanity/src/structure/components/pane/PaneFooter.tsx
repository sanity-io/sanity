import {Box, type BoxProps, Card, Layer} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type ReactNode} from 'react'
import {LegacyLayerProvider} from 'sanity'

import {usePane} from './usePane'
import * as styles from '../../Structure.css'

interface PaneFooterProps {
  children?: ReactNode
  padding?: BoxProps['padding']
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
      <Layer
        className={styles.paneFooterRootStyle}
        data-testid="pane-footer"
        hidden={collapsed}
        ref={ref}
      >
        <Card className={styles.paneFooterCardStyle} tone="inherit">
          <Box padding={padding}>{children}</Box>
        </Card>
      </Layer>
    </LegacyLayerProvider>
  )
})
