import {ClockIcon, ErrorOutlineIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Flex, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button, Dialog} from '../../../../../ui-components'
import {MONTH_PICKER_VARIANT} from '../../../../../ui-components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../../../ui-components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../../../../ui-components/inputs/DateInputs/DateTimeInput'
import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {getCalendarLabels} from '../../../../form/inputs/DateInputs/utils'
import {useDateTimeFormat} from '../../../../hooks'
import {Translate, useTranslation} from '../../../../i18n'
import {type ReleaseDocument} from '../../../../store'
import {useReleaseOperations} from '../../../../store/release/useReleaseOperations'
import {ScheduledRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
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

  const isValidatingDocuments = documents.some(({validation}) => validation.isValidating)
  const hasDocumentValidationErrors = documents.some(({validation}) => validation.hasError)
  const isScheduleButtonDisabled = disabled || isValidatingDocuments || hasDocumentValidationErrors

  const handleConfirmSchedule = useCallback(async () => {
    try {
      setStatus('scheduling')
      await schedule(release._id, new Date(release.metadata.intendedPublishAt!))
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
    schedule,
    release._id,
    release.metadata.intendedPublishAt,
    release.metadata.title,
    telemetry,
    toast,
    t,
  ])
  const {t: coreT} = useTranslation()
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(coreT), [coreT])
  const dateFormatter = useDateTimeFormat()

  const [publishAt, setPublishAt] = useState<Date | undefined>(
    release.metadata.intendedPublishAt ? new Date(release.metadata.intendedPublishAt) : new Date(),
  )
  const confirmScheduleDialog = useMemo(() => {
    if (status === 'idle') return null

    return (
      <Dialog
        id="confirm-schedule-dialog"
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
            disabled: status === 'scheduling',
          },
        }}
      >
        <Stack space={3}>
          <label>
            <Stack space={3}>
              <Text size={1} weight="semibold">
                {t('schedule-dialog.select-publish-date-label')}
              </Text>
              <DateTimeInput
                selectTime
                monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
                onChange={(date) => setPublishAt(date || undefined)}
                value={publishAt}
                calendarLabels={calendarLabels}
                inputValue={dateFormatter.format(publishAt)}
                constrainSize={false}
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
    t,
    documents.length,
    handleConfirmSchedule,
    calendarLabels,
    release.metadata.title,
    publishAt,
    dateFormatter,
  ])

  const tooltipText = useMemo(() => {
    if (isValidatingDocuments) {
      return t('schedule-button-tooltip.validation.loading')
    }

    if (hasDocumentValidationErrors) {
      return t('schedule-button-tooltip.validation.error')
    }

    if (release.state === 'scheduled' || release.state === 'scheduling') {
      return t('schedule-button-tooltip.already-scheduled')
    }
    return null
  }, [hasDocumentValidationErrors, isValidatingDocuments, release.state, t])

  // TODO: this is a duplicate of logic in ReleasePublishAllButton
  const scheduleTooltipContent = useMemo(() => {
    return (
      <Text muted size={1}>
        <Flex align="center" gap={3} padding={1}>
          <ToneIcon
            symbol={ErrorOutlineIcon}
            tone={isValidatingDocuments ? 'default' : 'critical'}
          />
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
        onClick={() => setStatus('confirm')}
        loading={status === 'scheduling'}
        data-testid="schedule-button"
      />
      {confirmScheduleDialog}
    </>
  )
}
