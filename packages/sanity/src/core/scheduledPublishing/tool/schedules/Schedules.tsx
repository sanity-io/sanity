import {Box} from '@sanity/ui'

import {useSchedules} from '../contexts/schedules'
import EmptySchedules from './EmptySchedules'
import VirtualList from './VirtualList'

export const Schedules = () => {
  const {activeSchedules, selectedDate, scheduleState} = useSchedules()
  return (
    <Box style={{height: '100%'}}>
      {activeSchedules.length === 0 ? (
        <Box padding={4}>
          <EmptySchedules scheduleState={scheduleState} selectedDate={selectedDate} />
        </Box>
      ) : (
        <VirtualList />
      )}
    </Box>
  )
}
