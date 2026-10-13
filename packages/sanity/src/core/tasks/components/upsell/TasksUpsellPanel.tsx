import {Suspense, use} from 'react'
import {Container, Box} from 'ui5'

import {NO_UPSELL_DATA} from '../../../hooks/useUpsellData'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useTasksUpsell} from '../../context/upsell/useTasksUpsell'

/**
 * The upsell panel at the top of the tasks sidebar in upsell mode. Waits for the upsell content
 * here, at the leaf, so the sidebar renders without it; nothing while it loads or when the request
 * failed.
 */
export function TasksUpsellPanel() {
  return (
    <Suspense>
      <TasksUpsellPanelContent />
    </Suspense>
  )
}

function TasksUpsellPanelContent() {
  const {
    upsellDataPromise,
    telemetryLogs: {panelPrimaryClicked: onPrimaryClick, panelSecondaryClicked: onSecondaryClick},
  } = useTasksUpsell()
  const {upsellData: data} = upsellDataPromise ? use(upsellDataPromise) : NO_UPSELL_DATA

  if (!data) return null
  return (
    <Container size={1}>
      <Box marginBottom={6}>
        <UpsellPanel
          data={data}
          onPrimaryClick={onPrimaryClick}
          onSecondaryClick={onSecondaryClick}
        />
      </Box>
    </Container>
  )
}
