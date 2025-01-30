import {ClockIcon, ErrorOutlineIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {format, isBefore, isValid, parse, startOfMinute} from 'date-fns'
import {useCallback, useMemo, useState} from 'react'

import {Button, Dialog} from '../../../../../ui-components'
import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {MONTH_PICKER_VARIANT} from '../../../../components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../../components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../../../components/inputs/DateInputs/DateTimeInput'
import {getCalendarLabels} from '../../../../form/inputs/DateInputs/utils'
import {Translate, useTranslation} from '../../../../i18n'
import {ScheduledRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {isReleaseScheduledOrScheduling, type ReleaseDocument} from '../../../index'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {type DocumentInRelease} from '../../detail/useBundleDocuments'

interface ReleaseScheduleButtonProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  disabled?: boolean
}

export const ReleaseScheduleButton = ({
  release,
  disabled,
  documents,
}: ReleaseScheduleButtonProps) => {
  const toast = useToast()
  const {schedule} = useReleaseOperations()
  const {t} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()
  const [status, setStatus] = useState<'idle' | 'confirm' | 'scheduling'>('idle')
  const [publishAt, setPublishAt] = useState<Date | undefined>()
  /**
   * This state supports the scenario of:
   * publishAt is set to a valid future date; but at time of submit it is in the past
   * Without an update on this state, ReleaseScheduledButton would not rerender
   * and so date in past warning ui elements wouldn't show
   */
  const [rerenderDialog, setRerenderDialog] = useState(0)

  const isValidatingDocuments = documents.some(({validation}) => validation.isValidating)
  const hasDocumentValidationErrors = documents.some(({validation}) => validation.hasError)
  const isScheduleButtonDisabled = disabled || isValidatingDocuments

  const isScheduledDateInPast = useCallback(() => {
    return isBefore(publishAt || new Date(), new Date())
  }, [publishAt])

  const handleConfirmSchedule = useCallback(async () => {
    if (!publishAt) return

    if (isScheduledDateInPast()) {
      // rerender dialog to recalculate isScheduledDateInPast
      setRerenderDialog((cur) => cur + 1)
      return
    }

    try {
      setStatus('scheduling')
      await schedule(release._id, publishAt)
      telemetry.log(ScheduledRelease)
      toast.push({
        closable: true,
        status: 'success',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.schedule.success"
              values={{title: release.metadata.title}}
            />
          </Text>
        ),
      })
    } catch (schedulingError) {
      toast.push({
        status: 'error',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.schedule.error"
              values={{title: release.metadata.title, error: schedulingError.message}}
            />
          </Text>
        ),
      })
      console.error(schedulingError)
    } finally {
      setStatus('idle')
    }
  }, [
    publishAt,
    isScheduledDateInPast,
    schedule,
    release._id,
    release.metadata.title,
    telemetry,
    toast,
    t,
  ])

  const {t: coreT} = useTranslation()
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(coreT), [coreT])

  const handleBundlePublishAtCalendarChange = useCallback((date: Date | null) => {
    if (!date) return

    setPublishAt(startOfMinute(date))
  }, [])

  const handleBundleInputChange = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const date = event.currentTarget.value
    const parsedDate = parse(date, 'PP HH:mm', new Date())

    if (isValid(parsedDate)) {
      setPublishAt(parsedDate)
    }
  }, [])

  const confirmScheduleDialog = useMemo(() => {
    if (status === 'idle') return null

    const _isScheduledDateInPast = isScheduledDateInPast()

    return (
      <Dialog
        id="confirm-schedule-dialog"
        /**
         * rerenderDialog should force this function to rerun
         * since the selected scheduled date was in the future when selected
         * but at time of submit it is in the past
         */
        key={rerenderDialog}
        header={t('schedule-dialog.confirm-title', {
          documentsLength: documents.length,
          count: documents.length,
        })}
        onClose={() => setStatus('idle')}
        footer={{
          confirmButton: {
            text: t('schedule-dialog.confirm-button'),
            tone: 'default',
            onClick: handleConfirmSchedule,
            loading: status === 'scheduling',
            disabled: _isScheduledDateInPast || status === 'scheduling',
          },
        }}
      >
        <Stack space={3}>
          {_isScheduledDateInPast && (
            <Card marginBottom={1} padding={2} radius={2} shadow={1} tone="critical">
              <Text size={1}>{t('schedule-dialog.publish-date-in-past-warning')}</Text>
            </Card>
          )}
          <label>
            <Stack space={3}>
              <Text size={1} weight="semibold">
                {t('schedule-dialog.select-publish-date-label')}
              </Text>
              <DateTimeInput
                selectTime
                monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
                onChange={handleBundlePublishAtCalendarChange}
                onInputChange={handleBundleInputChange}
                value={publishAt}
                calendarLabels={calendarLabels}
                inputValue={publishAt ? format(publishAt, 'PP HH:mm') : ''}
                constrainSize={false}
                isPastDisabled
              />
            </Stack>
          </label>
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="schedule-dialog.confirm-description"
              values={{
                title: release.metadata.title,
                count: documents.length,
              }}
            />
          </Text>
        </Stack>
      </Dialog>
    )
  }, [
    status,
    isScheduledDateInPast,
    t,
    documents.length,
    handleConfirmSchedule,
    handleBundlePublishAtCalendarChange,
    handleBundleInputChange,
    publishAt,
    calendarLabels,
    release.metadata.title,
    rerenderDialog,
  ])

  const handleOnInitialSchedule = useCallback(() => {
    setPublishAt(
      release.metadata.intendedPublishAt
        ? new Date(release.metadata.intendedPublishAt)
        : new Date(),
    )
    setStatus('confirm')
  }, [release.metadata.intendedPublishAt])

  const tooltipText = useMemo(() => {
    if (isValidatingDocuments) {
      return t('schedule-button-tooltip.validation.loading')
    }

    if (hasDocumentValidationErrors) {
      return t('schedule-button-tooltip.validation.error')
    }

    if (isReleaseScheduledOrScheduling(release)) {
      return t('schedule-button-tooltip.already-scheduled')
    }
    return null
  }, [hasDocumentValidationErrors, isValidatingDocuments, release, t])

  // TODO: this is a duplicate of logic in ReleasePublishAllButton
  const scheduleTooltipContent = useMemo(() => {
    return (
      <Text muted size={1}>
        <Flex align="center" gap={3} padding={1}>
          <ToneIcon icon={ErrorOutlineIcon} tone={isValidatingDocuments ? 'default' : 'critical'} />
          {tooltipText}
        </Flex>
      </Text>
    )
  }, [isValidatingDocuments, tooltipText])

  return (
    <>
      <Button
        tooltipProps={{
          disabled: !tooltipText,
          content: scheduleTooltipContent,
          placement: 'bottom',
        }}
        tone="primary"
        icon={ClockIcon}
        disabled={isScheduleButtonDisabled || status === 'scheduling'}
        text={t('action.schedule')}
        onClick={handleOnInitialSchedule}
        loading={status === 'scheduling'}
        data-testid="schedule-button"
      />
      {confirmScheduleDialog}
    </>
  )
}
