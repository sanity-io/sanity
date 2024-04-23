import {Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {format} from 'date-fns'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {scheduledPublishingNamespace} from '../../i18n'
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
  const {t} = useTranslation(scheduledPublishingNamespace)
  let BigIcon
  let description
  let heading
  switch (scheduleState) {
    case 'succeeded': {
      description = t('empty-schedules.succeeded.description')
      heading = t('empty-schedules.succeeded.title')
      BigIcon = BigIconComingSoon
      break
    }
    case 'cancelled': {
      description = t('empty-schedules.canceled.description')

      heading = t('empty-schedules.canceled.title')
      BigIcon = BigIconSuccess
      break
    }
    case 'scheduled': {
      description = t('empty-schedules.scheduled.description')
      heading = t('empty-schedules.scheduled.title')
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
