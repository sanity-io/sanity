import {Suspense, use} from 'react'
import {Container, Box} from 'ui5'

import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useCommentsUpsell} from '../../hooks/useCommentsUpsell'

/**
 * The upsell panel at the top of the comments inspector in upsell mode. Waits for the upsell
 * content here, at the leaf, so the inspector renders without it; nothing while it loads or when
 * the request failed.
 */
export function CommentsUpsellPanel() {
  return (
    <Suspense>
      <CommentsUpsellPanelContent />
    </Suspense>
  )
}

function CommentsUpsellPanelContent() {
  const {upsellDataPromise, telemetryLogs} = useCommentsUpsell()
  const {upsellData} = use(upsellDataPromise)

  if (!upsellData) return null
  return (
    <Container size={1}>
      <Box marginBottom={6}>
        <UpsellPanel
          data={upsellData}
          onPrimaryClick={telemetryLogs.panelPrimaryClicked}
          onSecondaryClick={telemetryLogs.panelSecondaryClicked}
        />
      </Box>
    </Container>
  )
}
