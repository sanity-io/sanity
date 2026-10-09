import {CalendarIcon} from '@sanity/icons/Calendar'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type ValidationMarker} from '@sanity/types'
import {Badge, Card, Inline} from '@sanity/ui'
import {format} from 'date-fns/format'
import {type CSSProperties} from 'react'
import {Text, Box, Flex, VStack, Icon} from 'ui5'

import {useScheduledPublishingEnabled} from '../../../scheduledPublishing/contexts/ScheduledPublishingEnabledProvider'
import {DATE_FORMAT} from '../../../studio/timezones/constants'
import {DOCUMENT_HAS_ERRORS_TEXT} from '../../constants'
import usePollSchedules from '../../hooks/usePollSchedules'
import {usePublishedId} from '../../hooks/usePublishedId'
import {useValidationState} from '../../utils/validationUtils'

const PRIMARY_FOREGROUND_STYLE = {
  '--text-color': 'var(--card-fg-color)',
  '--text-color-muted': 'var(--card-muted-fg-color)',
  '--icon-color': 'var(--card-fg-color)',
  '--icon-color-muted': 'var(--card-muted-fg-color)',
} as CSSProperties & {
  '--text-color': string
  '--text-color-muted': string
  '--icon-color': string
  '--icon-color-muted': string
}

interface Props {
  id: string
  markers: ValidationMarker[]
}

export function ScheduleBanner(props: Props) {
  const {id, markers} = props
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
          <Flex alignItems="center" gap={3} padding={1}>
            <Icon icon={WarningOutlineIcon} muted size={1} tone="caution" />
            <Text muted size={1} weight="medium" as="div" trim={true} tone="caution">
              Scheduled publishing is not available on your current plan
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
        <VStack gap={2}>
          <Flex alignItems="center" gap={3} marginBottom={1} padding={1}>
            <Icon
              icon={CalendarIcon}
              muted
              size={1}
              tone={hasError ? 'critical' : undefined}
              style={hasError ? undefined : PRIMARY_FOREGROUND_STYLE}
            />
            <Text
              muted
              size={1}
              as="div"
              trim={true}
              tone={hasError ? 'critical' : undefined}
              style={hasError ? undefined : PRIMARY_FOREGROUND_STYLE}
            >
              <span style={{fontWeight: 600}}>Upcoming schedule</span> (local time)
            </Text>
          </Flex>

          <VStack gap={2}>
            {schedules.map((schedule) => {
              if (!schedule.executeAt) {
                return null
              }
              const formattedDateTime = format(new Date(schedule.executeAt), DATE_FORMAT.LARGE)
              return (
                <Inline key={schedule.id} gap={2}>
                  <Text
                    muted
                    size={1}
                    as="div"
                    trim={true}
                    tone={hasError ? 'critical' : undefined}
                    style={hasError ? undefined : PRIMARY_FOREGROUND_STYLE}
                  >
                    {formattedDateTime}
                  </Text>
                  {/* HACK: Hide non unpublish schedules to maintain layout */}
                  <Flex style={{opacity: schedule.action === 'unpublish' ? 1 : 0}}>
                    <Badge fontSize={0}>{schedule.action}</Badge>
                  </Flex>
                </Inline>
              )
            })}
          </VStack>

          {hasError && (
            <Box marginTop={3}>
              <Text muted size={1} weight="regular" as="div" trim={true} tone="critical">
                {DOCUMENT_HAS_ERRORS_TEXT}
              </Text>
            </Box>
          )}
        </VStack>
      </Card>
    </Box>
  )
}
