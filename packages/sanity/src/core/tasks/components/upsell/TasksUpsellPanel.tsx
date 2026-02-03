import {Box, Container} from '@sanity/ui'

import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useTasksUpsell} from '../../context'

export function TasksUpsellPanel() {
  const {
    upsellData: data,
    telemetryLogs: {panelPrimaryClicked: onPrimaryClick, panelSecondaryClicked: onSecondaryClick},
  } = useTasksUpsell()

  if (!data) return null
  return (
    <Container width={1}>
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
