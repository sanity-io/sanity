import {Box, Stack, Text} from '@sanity/ui'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {ScheduleItem} from '../../../components/scheduleItem'
import {scheduledPublishingNamespace} from '../../../i18n'
import {type Schedule} from '../../../types'

interface Props {
  schedules: Schedule[]
}

export const Schedules = (props: Props) => {
  const {schedules} = props
  const {t} = useTranslation(scheduledPublishingNamespace)

  return (
    <Stack space={4}>
      {schedules.length === 0 ? (
        <Box>
          <Text size={1}>{t('schedule-action.schedule.empty')}</Text>
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
