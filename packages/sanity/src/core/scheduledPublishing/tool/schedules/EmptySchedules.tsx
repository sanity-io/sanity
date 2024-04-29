import {Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {format} from 'date-fns'

import {type ScheduleState} from '../../types'
import BigIconComingSoon from './BigIconComingSoon'
import BigIconScreen from './BigIconScreen'
import BigIconSuccess from './BigIconSuccess'

interface Props {
  scheduleState?: ScheduleState
  selectedDate?: Date
}

const EmptySchedules = (props: Props) => {
  const {scheduleState, selectedDate} = props

  let BigIcon
  let description
  let heading
  switch (scheduleState) {
    case 'succeeded': {
      description =
        'When a scheduled document is successfully published it moves to this list view.'
      heading = 'No completed scheduled publications ... yet'
      BigIcon = BigIconComingSoon
      break
    }
    case 'cancelled': {
      description =
        'Schedules can fail for several reasons, for example when their documents are deleted. When they do, they show up here.'
      heading = 'No failed scheduled publications'
      BigIcon = BigIconSuccess
      break
    }
    case 'scheduled': {
      description =
        'When editing a document, create a new scheduled publication from the menu next to the Publish button.'
      heading = 'No upcoming scheduled publications'
      BigIcon = BigIconScreen
      break
    }
    default:
      break
  }

  if (selectedDate) {
    description = 'No schedules for this date.'
    heading = format(selectedDate, 'd MMMM yyyy')
    BigIcon = BigIconScreen
  }

  return (
    <Card paddingX={6} paddingBottom={8} paddingTop={7} radius={2} shadow={1}>
      <Stack space={4}>
        <Flex justify="center">{BigIcon && <BigIcon />}</Flex>
        <Stack space={4}>
          {heading && (
            <Heading align="center" size={1}>
              {heading}
            </Heading>
          )}
          {description && (
            <Text align="center" size={1}>
              {description}
            </Text>
          )}
        </Stack>
      </Stack>
    </Card>
  )
}

export default EmptySchedules
