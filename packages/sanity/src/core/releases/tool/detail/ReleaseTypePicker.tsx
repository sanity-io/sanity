import {LockIcon, PublishIcon} from '@sanity/icons'
import {Card, Flex, Spinner, Stack, TabList, Text, useClickOutsideEvent, useToast} from '@sanity/ui'
import {format, isBefore, isValid, parse, startOfMinute} from 'date-fns'
import {isEqual} from 'lodash'
import {useCallback, useMemo, useRef, useState} from 'react'

import {Button, Popover, Tab} from '../../../../ui-components'
import {MONTH_PICKER_VARIANT} from '../../../components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../components/inputs/DateInputs/calendar/types'
import {DatePicker} from '../../../components/inputs/DateInputs/DatePicker'
import {LazyTextInput} from '../../../components/inputs/DateInputs/LazyTextInput'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import useTimeZone from '../../../scheduledPublishing/hooks/useTimeZone'
import {ReleaseAvatar} from '../../components/ReleaseAvatar'
import {useReleaseTime} from '../../hooks/useReleaseTime'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseType} from '../../store'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {getIsScheduledDateInPast} from '../../util/getIsScheduledDateInPast'
import {getReleaseTone} from '../../util/getReleaseTone'
import {
  getPublishDateFromRelease,
  isReleaseScheduledOrScheduling,
  type NotArchivedRelease,
} from '../../util/util'
import {ReleaseTime} from '../components/ReleaseTime'

const dateInputFormat = 'PP HH:mm'

export function ReleaseTypePicker(props: {release: NotArchivedRelease}): React.JSX.Element {
  const {release} = props

  const popoverRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const datePickerRef = useRef<HTMLDivElement | null>(null)

  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const {t} = useTranslation()
  const {updateRelease} = useReleaseOperations()
  const toast = useToast()
  const {utcToCurrentZoneDate, zoneDateToUtc} = useTimeZone()
  const getReleaseTime = useReleaseTime()

  const [open, setOpen] = useState(false)
  const [releaseType, setReleaseType] = useState<ReleaseType>(release.metadata.releaseType)
  const publishDate = useMemo(() => getPublishDateFromRelease(release), [release])
  const [isUpdating, setIsUpdating] = useState(false)
  const [isIntendedScheduleDateInPast, setIsIntendedScheduleDateInPast] = useState(
    publishDate && isBefore(new Date(publishDate), new Date()),
  )

  const [intendedPublishAt, setIntendedPublishAt] = useState<Date | undefined>(
    publishDate ? new Date(publishDate) : undefined,
  )
  const updatedDate = intendedPublishAt?.toISOString()
  const intendedPublishAtTimezoneAdjusted = intendedPublishAt
    ? utcToCurrentZoneDate(intendedPublishAt)
    : intendedPublishAt

  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(t), [t])

  const close = useCallback(() => {
    // a bit of a hack to make sure the timezone dialog is not immediately closed on out
    // the dialog itself is in the Calendar component who is basically unrealted to this one
    const dialog = document.querySelector('#time-zone')

    if (open && !dialog) {
      const newRelease = {
        ...release,
        metadata: {
          ...release.metadata,
          releaseType,
          ...(typeof updatedDate === 'undefined' || releaseType !== 'scheduled'
            ? {}
            : {
                intendedPublishAt: updatedDate,
              }),
        },
      }

      if (!isEqual(newRelease, release)) {
        /**
         * If in past, the reset type and intendedPublish to the actual release values
         * and discard the changes made
         */
        if (getIsScheduledDateInPast(newRelease)) {
          setReleaseType(release.metadata.releaseType)
          setIntendedPublishAt(
            release.metadata.intendedPublishAt
              ? new Date(release.metadata.intendedPublishAt)
              : undefined,
          )

          toast.push({
            closable: true,
            status: 'warning',
            title: tRelease('schedule-dialog.publish-date-in-past-warning'),
          })
        } else {
          setIsUpdating(true)
          updateRelease(newRelease).finally(() => {
            setIsUpdating(false)
          })
        }
      }

      setOpen(false)
    }
  }, [open, release, updatedDate, releaseType, toast, tRelease, updateRelease])

  useClickOutsideEvent(close, () => [
    popoverRef.current,
    buttonRef.current,
    inputRef.current,
    datePickerRef.current,
  ])

  const isPublishDateInPast = !!publishDate && isBefore(new Date(publishDate), new Date())
  const isReleaseScheduled = isReleaseScheduledOrScheduling(release)

  const publishDateLabel = useMemo(() => {
    if (release.state === 'published') {
      if (isPublishDateInPast && publishDate)
        return tRelease('dashboard.details.published-on', {
          date: getReleaseTime(release),
        })

      return tRelease('dashboard.details.published-asap')
    }

    return <ReleaseTime release={release} />
  }, [getReleaseTime, isPublishDateInPast, publishDate, release, tRelease])

  const handleButtonReleaseTypeChange = useCallback(
    (pickedReleaseType: ReleaseType) => {
      setReleaseType(pickedReleaseType)
      const nextPublishAt =
        pickedReleaseType === 'scheduled'
          ? (publishDate ?? startOfMinute(new Date()))
          : (publishDate ?? undefined)
      setIntendedPublishAt(nextPublishAt)
      setIsIntendedScheduleDateInPast(true)
    },
    [publishDate],
  )

  const handlePublishAtCalendarChange = useCallback(
    (date: Date | null) => {
      if (!date) return

      const cleanDate = zoneDateToUtc(startOfMinute(new Date(date)))
      setIsIntendedScheduleDateInPast(isBefore(cleanDate, new Date()))
      setIntendedPublishAt(cleanDate)
    },
    [zoneDateToUtc],
  )

  const handlePublishAtInputChange = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const parsedDate = zoneDateToUtc(
        parse(event.currentTarget.value, dateInputFormat, new Date()),
      )

      if (isValid(parsedDate)) {
        setIsIntendedScheduleDateInPast(isBefore(parsedDate, new Date()))

        setIntendedPublishAt(startOfMinute(parsedDate))
      }
    },
    [zoneDateToUtc],
  )

  const handleOnPickerClick = () => {
    if (open) close()
    else setOpen(true)
  }

  const PopoverContent = () => {
    return (
      <Stack space={1}>
        <TabList space={0.5}>
          <Tab
            aria-controls="release-timing-asap"
            id="release-timing-asap-tab"
            onClick={() => handleButtonReleaseTypeChange('asap')}
            label={t('release.type.asap')}
            selected={releaseType === 'asap'}
          />
          <Tab
            aria-controls="release-timing-at-time"
            id="release-timing-at-time-tab"
            onClick={() => handleButtonReleaseTypeChange('scheduled')}
            selected={releaseType === 'scheduled'}
            label={t('release.type.scheduled')}
          />
          <Tab
            aria-controls="release-timing-undecided"
            id="release-timing-undecided-tab"
            onClick={() => handleButtonReleaseTypeChange('undecided')}
            selected={releaseType === 'undecided'}
            label={t('release.type.undecided')}
          />
        </TabList>
        {releaseType === 'scheduled' && (
          <>
            {isIntendedScheduleDateInPast && (
              <Card margin={1} padding={2} radius={2} shadow={1} tone="critical">
                <Text size={1}>{tRelease('schedule-dialog.publish-date-in-past-warning')}</Text>
              </Card>
            )}
            <LazyTextInput
              data-testid="date-input"
              value={
                intendedPublishAtTimezoneAdjusted
                  ? format(intendedPublishAtTimezoneAdjusted, dateInputFormat)
                  : undefined
              }
              onChange={handlePublishAtInputChange}
            />
            <DatePicker
              ref={datePickerRef}
              monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
              calendarLabels={calendarLabels}
              selectTime
              padding={0}
              value={intendedPublishAtTimezoneAdjusted}
              onChange={handlePublishAtCalendarChange}
              isPastDisabled
              showTimezone
            />
          </>
        )}
      </Stack>
    )
  }

  const tone = release.state === 'published' ? 'positive' : getReleaseTone(release)

  const releaseTypeIcon = useMemo(() => {
    if (isUpdating) return <Spinner size={1} data-testid="updating-release-spinner" />
    if (release.state === 'published') return <PublishIcon />

    return <ReleaseAvatar tone={tone} padding={0} />
  }, [isUpdating, release.state, tone])

  const labelContent = useMemo(
    () => (
      <Flex flex={1} gap={2} align={'center'}>
        {releaseTypeIcon}
        <Text muted size={1} data-testid="release-type-label" weight="medium">
          {publishDateLabel}
        </Text>

        {isReleaseScheduled && (
          <Text size={1}>
            <LockIcon />
          </Text>
        )}
      </Flex>
    ),
    [isReleaseScheduled, publishDateLabel, releaseTypeIcon],
  )

  return (
    <Popover
      content={<PopoverContent />}
      open={open}
      padding={1}
      placement="bottom-start"
      ref={popoverRef}
    >
      {release.state === 'published' ? (
        <Card
          tone="default"
          data-testid="published-release-type-label"
          padding={2}
          style={{borderRadius: '999px'}}
        >
          {labelContent}
        </Card>
      ) : (
        <Button
          disabled={isReleaseScheduled}
          mode="bleed"
          onClick={handleOnPickerClick}
          ref={buttonRef}
          tooltipProps={{
            placement: 'bottom',
            content: isReleaseScheduled && tRelease('type-picker.tooltip.scheduled'),
          }}
          selected={open}
          tone={tone}
          style={{borderRadius: '999px'}}
          data-testid="release-type-picker"
        >
          {labelContent}
        </Button>
      )}
    </Popover>
  )
}
