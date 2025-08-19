import {Card, Stack, Text} from '@sanity/ui'
import {format, isBefore, isValid, parse, startOfMinute} from 'date-fns'
import {useCallback, useMemo, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {MONTH_PICKER_VARIANT} from '../../../components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../../components/inputs/DateInputs/DateTimeInput'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {useTimeZone} from '../../../hooks/useTimeZone'
import {useTranslation} from '../../../i18n'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'
import {releasesLocaleNamespace} from '../../i18n'

interface ScheduleDraftDialogProps {
  onClose: () => void
  onSchedule: (publishAt: Date) => void
  header: string
  description: string
  confirmButtonText: string
  confirmButtonTone?: 'primary' | 'critical'
  loading?: boolean
}

export function ScheduleDraftDialog(props: ScheduleDraftDialogProps): React.JSX.Element {
  const {
    onClose,
    onSchedule,
    header,
    description,
    confirmButtonText,
    confirmButtonTone = 'primary',
    loading = false,
  } = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()

  const [publishAt, setPublishAt] = useState<Date | undefined>(new Date())

  const {utcToCurrentZoneDate, zoneDateToUtc} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)

  const timeZoneAdjustedPublishAt = publishAt ? utcToCurrentZoneDate(publishAt) : undefined

  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(tCore), [tCore])

  const isScheduledDateInPast = useCallback(() => {
    if (!publishAt) return true
    return isBefore(zoneDateToUtc(publishAt), new Date())
  }, [publishAt, zoneDateToUtc])

  const handleDateTimeChange = useCallback(
    (date: Date | null) => {
      if (!date) return
      setPublishAt(zoneDateToUtc(startOfMinute(date)))
    },
    [zoneDateToUtc],
  )

  const handleInputChange = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const date = event.currentTarget.value
      const parsedDate = zoneDateToUtc(parse(date, 'PP HH:mm', new Date()))

      if (isValid(parsedDate)) {
        setPublishAt(parsedDate)
      }
    },
    [zoneDateToUtc],
  )

  const handleConfirmSchedule = useCallback(async () => {
    if (!publishAt || isScheduledDateInPast()) return
    onSchedule(publishAt)
  }, [publishAt, isScheduledDateInPast, onSchedule])

  const _isScheduledDateInPast = isScheduledDateInPast()

  return (
    <Dialog
      id="schedule-draft-dialog"
      header={header}
      onClose={loading ? undefined : onClose}
      width={0}
      padding={false}
      footer={{
        confirmButton: {
          text: confirmButtonText,
          tone: confirmButtonTone,
          onClick: handleConfirmSchedule,
          loading: loading,
          disabled: _isScheduledDateInPast || loading || !publishAt,
        },
        cancelButton: {
          disabled: loading,
        },
      }}
    >
      <Stack space={4} paddingX={4} paddingBottom={4}>
        <Text size={1} muted>
          {description}
        </Text>

        <label>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              {t('schedule-dialog.select-publish-date-label')}
            </Text>
            <DateTimeInput
              selectTime
              monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
              onChange={handleDateTimeChange}
              onInputChange={handleInputChange}
              value={timeZoneAdjustedPublishAt}
              calendarLabels={calendarLabels}
              inputValue={
                timeZoneAdjustedPublishAt ? format(timeZoneAdjustedPublishAt, 'PP HH:mm') : ''
              }
              constrainSize={false}
              isPastDisabled
              timeZoneScope={CONTENT_RELEASES_TIME_ZONE_SCOPE}
            />
          </Stack>
        </label>

        {_isScheduledDateInPast && (
          <Card marginBottom={1} padding={2} radius={2} shadow={1} tone="critical">
            <Text size={1}>{t('schedule-dialog.publish-date-in-past-warning')}</Text>
          </Card>
        )}
      </Stack>
    </Dialog>
  )
}
