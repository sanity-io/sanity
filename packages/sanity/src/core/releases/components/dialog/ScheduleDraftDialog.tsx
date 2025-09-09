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

type ScheduleDraftDialogVariant = 'schedule' | 'edit-schedule'

interface ScheduleDraftDialogConfig {
  headerI18nKey: string
  descriptionI18nKey: string
  confirmButtonTextI18nKey: string
}

const SCHEDULE_DRAFT_DIALOG_CONFIG: Record<ScheduleDraftDialogVariant, ScheduleDraftDialogConfig> =
  {
    'schedule': {
      headerI18nKey: 'schedule-publish-dialog.header',
      descriptionI18nKey: 'schedule-publish-dialog.description',
      confirmButtonTextI18nKey: 'schedule-publish-dialog.confirm',
    },
    'edit-schedule': {
      headerI18nKey: 'release.dialog.edit-schedule.header',
      descriptionI18nKey: 'release.dialog.edit-schedule.body',
      confirmButtonTextI18nKey: 'release.dialog.edit-schedule.confirm',
    },
  }

interface ScheduleDraftDialogProps {
  onClose: () => void
  onSchedule: (publishAt: Date) => void
  variant: ScheduleDraftDialogVariant
  loading?: boolean
  initialDate?: Date | string
}

export function ScheduleDraftDialog(props: ScheduleDraftDialogProps): React.JSX.Element {
  const {onClose, onSchedule, variant, loading = false, initialDate} = props
  const {t: tCore} = useTranslation()

  const [publishAt, setPublishAt] = useState<Date | undefined>(
    () => new Date(initialDate || new Date()),
  )

  const {utcToCurrentZoneDate, zoneDateToUtc} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)

  const timeZoneAdjustedPublishAt = publishAt ? utcToCurrentZoneDate(publishAt) : undefined

  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(tCore), [tCore])

  // Get dialog configuration based on variant
  const dialogConfig = SCHEDULE_DRAFT_DIALOG_CONFIG[variant]

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
      header={tCore(dialogConfig.headerI18nKey)}
      onClose={loading ? undefined : onClose}
      width={0}
      padding={false}
      footer={{
        confirmButton: {
          text: tCore(dialogConfig.confirmButtonTextI18nKey),
          tone: 'primary',
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
          {tCore(dialogConfig.descriptionI18nKey)}
        </Text>

        <label>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              {tCore('release.schedule-dialog.select-publish-date-label')}
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
            <Text size={1}>{tCore('release.schedule-dialog.publish-date-in-past-warning')}</Text>
          </Card>
        )}
      </Stack>
    </Dialog>
  )
}
