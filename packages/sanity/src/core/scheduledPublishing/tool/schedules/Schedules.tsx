/* eslint-disable react/jsx-handler-names */
import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useScheduledPublishingEnabled} from '../contexts/ScheduledPublishingEnabledProvider'
import {useSchedulePublishingUpsell} from '../contexts/SchedulePublishingUpsellProvider'
import {useSchedules} from '../contexts/schedules'
import EmptySchedules from './EmptySchedules'
import VirtualList from './VirtualList'

const Panel = styled(Container)`
  width: auto;
`

export const Schedules = () => {
  const {activeSchedules, selectedDate, scheduleState} = useSchedules()
  const {upsellData, telemetryLogs} = useSchedulePublishingUpsell()
  const {mode} = useScheduledPublishingEnabled()
  const showWarning = mode === 'upsell' && scheduleState === 'scheduled'
  return (
    <Box style={{height: '100%'}}>
      {mode === 'upsell' && upsellData && (
        <Panel width={1} padding={4} paddingBottom={1}>
          <UpsellPanel
            layout="horizontal"
            data={upsellData}
            onPrimaryClick={telemetryLogs.panelPrimaryClicked}
            onSecondaryClick={telemetryLogs.panelSecondaryClicked}
          />
        </Panel>
      )}
      {activeSchedules.length === 0 ? (
        <Panel width={1} padding={4} paddingTop={4}>
          <EmptySchedules scheduleState={scheduleState} selectedDate={selectedDate} />
        </Panel>
      ) : (
        <>
          {showWarning && (
            <Card margin={4} marginBottom={2} padding={3} tone="caution" radius={3} shadow={1}>
              <Flex gap={3} align={'center'}>
                <Text size={1}>
                  <WarningOutlineIcon />
                </Text>
                <Text size={1}>
                  Your scheduled documents won't be published automatically unless you upgrade your
                  plan. You can still publish them manually.
                </Text>
              </Flex>
            </Card>
          )}
          <Box paddingTop={showWarning ? 0 : 4}>
            <VirtualList />
          </Box>
        </>
      )}
    </Box>
  )
}
