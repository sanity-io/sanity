import {type ReleaseDocument} from '@sanity/client'
import {ClockIcon, ErrorOutlineIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Card, Flex, Stack, Text, useToast} from '@sanity/ui'
import {format, isBefore, isValid, parse, startOfMinute} from 'date-fns'
import {isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
import {Dialog} from '../../../../../ui-components/dialog/Dialog'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import type {TooltipProps} from '../../../../../ui-components/tooltip/Tooltip'
import {ToneIcon} from '../../../../../ui-components/toneIcon/ToneIcon'
import {MONTH_PICKER_VARIANT} from '../../../../components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../../components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../../../components/inputs/DateInputs/DateTimeInput'
import {getCalendarLabels} from '../../../../form/inputs/DateInputs/utils'
import {useTimeZone} from '../../../../hooks/useTimeZone'
import {Translate} from '../../../../i18n/Translate'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../../studio/constants'
import {ScheduledRelease} from '../../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../../i18n'
import {isReleaseScheduledOrScheduling} from '../../../util/util'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
import {type DocumentInRelease} from '../../detail/useBundleDocuments'

interface ReleaseScheduleButtonProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  disabled?: boolean
  isMenuItem?: boolean
  onConfirmDialogOpen?: () => void
  onConfirmDialogClose?: () => void
}

export const ReleaseScheduleButton = ({
  release,
  disabled,
  documents,
  isMenuItem = false,
  onConfirmDialogOpen,
  onConfirmDialogClose,
}: ReleaseScheduleButtonProps) => {
  const toast = useToast()
  const {schedule, updateRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()

  const [schedulePermission, setSchedulePermission] = useState<boolean>(false)

  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const telemetry = useTelemetry()
  // in the releases tool we want timezone to be saved for releases
  const {utcToCurrentZoneDate, zoneDateToUtc} = useTimeZone(CONTENT_RELEASES_TIME_ZONE_SCOPE)
  const [status, setStatus] = useState<'idle' | 'confirm' | 'scheduling'>('idle')
  const [publishAt, setPublishAt] = useState<Date | undefined>()
  /**
   * This state supports the scenario of:
   * publishAt is set to a valid future date; but at time of submit it is in the past
   * Without an update on this state, ReleaseScheduledButton would not rerender
   * and so date in past warning ui elements wouldn't show
   */
  const [rerenderDialog, setRerenderDialog] = useState(0)

  const timeZoneAdjustedPublishAt = publishAt ? utcToCurrentZoneDate(publishAt) : undefined

  const isValidatingDocuments = documents.some(({validation}) => validation.isValidating)
  const hasDocumentValidationErrors = documents.some(({validation}) => validation.hasError)
  const isScheduleButtonDisabled =
    disabled || isValidatingDocuments || !schedulePermission || hasDocumentValidationErrors

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true

    checkWithPermissionGuard(schedule, release._id, new Date()).then((hasPermission) => {
      if (isMounted.current) setSchedulePermission(hasPermission)
    })

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, release._id, release.metadata.intendedPublishAt, schedule])

  const isScheduledDateInPast = useCallback(() => {
    return isBefore(zoneDateToUtc(publishAt || new Date()), new Date())
  }, [publishAt, zoneDateToUtc])

  const handleConfirmSchedule = useCallback(async () => {
    if (!publishAt) return

    // this means that it will linely need to change the releaseType to scheduled
    if (isMenuItem) {
      const newRelease = {
        ...release,
        metadata: {
          ...release.metadata,
          releaseType: 'scheduled' as const,

          intendedPublishAt: publishAt.toISOString(),
        },
      }

      if (!isEqual(newRelease, release)) {
        updateRelease(newRelease)
      }
    }

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
        status: 'info',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="toast.schedule.success"
              values={{
                title: release.metadata.title || tCore('release.placeholder-untitled-release'),
              }}
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
              values={{
                title: release.metadata.title || tCore('release.placeholder-untitled-release'),
                error: schedulingError.message,
              }}
            />
          </Text>
        ),
      })
      console.error(schedulingError)
    } finally {
      onConfirmDialogClose?.()
      setStatus('idle')
    }
  }, [
    publishAt,
    isMenuItem,
    isScheduledDateInPast,
    release,
    updateRelease,
    schedule,
    telemetry,
    toast,
    t,
    tCore,
    onConfirmDialogClose,
  ])

  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(tCore), [tCore])

  const handleBundlePublishAtCalendarChange = useCallback(
    (date: Date | null) => {
      if (!date) return

      setPublishAt(zoneDateToUtc(startOfMinute(date)))
    },
    [zoneDateToUtc],
  )

  const handleBundleInputChange = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const date = event.currentTarget.value
      const parsedDate = zoneDateToUtc(parse(date, 'PP HH:mm', new Date()))

      if (isValid(parsedDate)) {
        setPublishAt(parsedDate)
      }
    },
    [zoneDateToUtc],
  )

  const handleOnDialogClose = useCallback(() => {
    onConfirmDialogClose?.()
    if (status !== 'scheduling') {
      setStatus('idle')
    }
  }, [onConfirmDialogClose, status])

  const confirmScheduleDialog = useMemo(() => {
    if (status === 'idle') return null

    const _isScheduledDateInPast = isScheduledDateInPast()

    return (
      <Dialog
        /**
         * rerenderDialog should force this function to rerun
         * since the selected scheduled date was in the future when selected
         * but at time of submit it is in the past
         */
        key={rerenderDialog}
        id="confirm-schedule-dialog"
        data-testid="confirm-schedule-dialog"
        header={t('schedule-dialog.confirm-title', {
          documentsLength: documents.length,
          count: documents.length,
        })}
        onClose={handleOnDialogClose}
        footer={{
          confirmButton: {
            text: t('schedule-dialog.confirm-button'),
            tone: 'default',
            onClick: handleConfirmSchedule,
            loading: status === 'scheduling',
            disabled: _isScheduledDateInPast || status === 'scheduling',
          },
          cancelButton: {
            disabled: status === 'scheduling',
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
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey="schedule-dialog.confirm-description"
              values={{
                title: release.metadata.title || tCore('release.placeholder-untitled-release'),
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
    rerenderDialog,
    t,
    documents.length,
    handleOnDialogClose,
    handleConfirmSchedule,
    handleBundlePublishAtCalendarChange,
    handleBundleInputChange,
    timeZoneAdjustedPublishAt,
    calendarLabels,
    release.metadata.title,
    tCore,
  ])

  const handleOnInitialSchedule = useCallback(() => {
    setPublishAt(
      release.metadata.intendedPublishAt
        ? new Date(release.metadata.intendedPublishAt)
        : new Date(),
    )
    setStatus('confirm')
    onConfirmDialogOpen?.()
  }, [onConfirmDialogOpen, release.metadata.intendedPublishAt])

  const tooltipText = useMemo(() => {
    if (documents.length === 0) {
      return t('schedule-action.validation.no-documents')
    }

    if (!schedulePermission) {
      return t('schedule-button-tooltip.validation.no-permission')
    }

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
  }, [
    documents.length,
    hasDocumentValidationErrors,
    isValidatingDocuments,
    release,
    schedulePermission,
    t,
  ])

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

  const sharedProps = useMemo(
    () => ({
      icon: ClockIcon,
      disabled: isScheduleButtonDisabled || status === 'scheduling' || documents.length === 0,
      text: t('action.schedule'),
      handleOnClick: handleOnInitialSchedule,
      tooltipProps: {
        disabled: !tooltipText,
        content: scheduleTooltipContent,
        placement: 'bottom',
      } as Partial<TooltipProps>,
    }),
    [
      documents.length,
      handleOnInitialSchedule,
      isScheduleButtonDisabled,
      scheduleTooltipContent,
      status,
      t,
      tooltipText,
    ],
  )

  return (
    <>
      {isMenuItem ? (
        <MenuItem
          tooltipProps={sharedProps.tooltipProps}
          icon={sharedProps.icon}
          disabled={sharedProps.disabled}
          text={sharedProps.text}
          onClick={sharedProps.handleOnClick}
          data-testid="schedule-button-menu-item"
        />
      ) : (
        <Button
          tooltipProps={sharedProps.tooltipProps}
          tone="primary"
          icon={sharedProps.icon}
          disabled={sharedProps.disabled}
          text={sharedProps.text}
          onClick={sharedProps.handleOnClick}
          loading={status === 'scheduling'}
          data-testid="schedule-button"
        />
      )}
      {confirmScheduleDialog}
    </>
  )
}
