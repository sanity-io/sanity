import {Text, Box, VStack} from 'ui5'

import {ScheduleItem} from '../../../components/scheduleItem'
import {type Schedule} from '../../../types'

interface Props {
  schedules: Schedule[]
}

const Schedules = (props: Props) => {
  const {schedules} = props

  return (
    <VStack gap={4}>
      {schedules.length === 0 ? (
        <Box>
          <Text size={1} as="div" trim={true}>
            No schedules
          </Text>
        </Box>
      ) : (
        <VStack gap={2}>
          {schedules.map((schedule) => (
            <ScheduleItem key={schedule.id} schedule={schedule} type="document" />
          ))}
        </VStack>
      )}
    </VStack>
  )
}

export default Schedules
