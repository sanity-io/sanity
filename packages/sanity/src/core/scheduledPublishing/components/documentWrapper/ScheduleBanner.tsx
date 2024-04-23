import {CalendarIcon, WarningOutlineIcon} from '@sanity/icons'
import {type ValidationMarker} from '@sanity/types'
import {Badge, Box, Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {format} from 'date-fns'
import {styled} from 'styled-components'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {DATE_FORMAT} from '../../constants'
import usePollSchedules from '../../hooks/usePollSchedules'
import {usePublishedId} from '../../hooks/usePublishedId'
import {scheduledPublishingNamespace} from '../../i18n'
import {useScheduledPublishingEnabled} from '../../tool/contexts/ScheduledPublishingEnabledProvider'
import {useValidationState} from '../../utils/validationUtils'

interface Props {
  id: string
  markers: ValidationMarker[]
}

const Strong = styled.span`
  font-weight: 600;
`

export function ScheduleBanner(props: Props) {
  const {id, markers} = props
  const {t} = useTranslation(scheduledPublishingNamespace)
  const publishedId = usePublishedId(id)
  const {hasError} = useValidationState(markers)
  const {schedules} = usePollSchedules({documentId: publishedId, state: 'scheduled'})
  const {mode} = useScheduledPublishingEnabled()

  const hasSchedules = schedules.length > 0
  if (!hasSchedules) {
    return null
  }

  return (
    <Box marginBottom={4}>
      {mode === 'upsell' && (
        <Card tone="caution" padding={3} radius={3} shadow={1} marginBottom={3}>
          <Flex align="center" gap={3} padding={1}>
            <Text muted size={1}>
              <WarningOutlineIcon />
            </Text>
            <Text muted size={1} weight="medium">
              {t('document-banner.not-enabled')}
            </Text>
          </Flex>
        </Card>
      )}
      <Card
        padding={3}
        radius={1}
        shadow={1}
        tone={hasError ? 'critical' : 'primary'}
        style={mode === 'upsell' ? {opacity: 0.7} : undefined}
      >
        <Stack space={2}>
          <Flex align="center" gap={3} marginBottom={1} padding={1}>
            <Text muted size={1}>
              <CalendarIcon />
            </Text>
            <Text muted size={1}>
              <Translate i18nKey="document-banner.upcoming" t={t} components={{Strong: Strong}} />
            </Text>
          </Flex>

          <Stack space={2}>
            {schedules.map((schedule) => {
              if (!schedule.executeAt) {
                return null
              }
              const formattedDateTime = format(new Date(schedule.executeAt), DATE_FORMAT.LARGE)
              return (
                <Inline key={schedule.id} space={2}>
                  <Text muted size={1}>
                    {formattedDateTime}
                  </Text>
                  {/* HACK: Hide non unpublish schedules to maintain layout */}
                  <Flex style={{opacity: schedule.action === 'unpublish' ? 1 : 0}}>
                    <Badge fontSize={0} mode="outline">
                      {schedule.action}
                    </Badge>
                  </Flex>
                </Inline>
              )
            })}
          </Stack>

          {hasError && (
            <Box marginTop={3}>
              <Text muted size={1} weight="regular">
                {t('schedule-preview.warnings')}
              </Text>
            </Box>
          )}
        </Stack>
      </Card>
    </Box>
  )
}
