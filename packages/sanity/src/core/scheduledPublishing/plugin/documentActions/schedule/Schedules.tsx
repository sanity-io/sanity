import {Box, Stack, Text} from '@sanity/ui'

import {type Schedule} from '../../../../studio/timezones/types'
import {ScheduleItem} from '../../../components/scheduleItem'

interface Props {
  schedules: Schedule[]
}

const Schedules = (props: Props) => {
  const {schedules} = props

  return (
    <Stack space={4}>
      {schedules.length === 0 ? (
        <Box>
          <Text size={1}>No schedules</Text>
        </Box>
      ) : (
        <Stack space={2}>
          {schedules.map((schedule) => (
            <ScheduleItem key={schedule.id} schedule={schedule} type="document" />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

export default Schedules
