import {LockIcon} from '@sanity/icons'
import {Card, Flex, Spinner, Stack, TabList, Text, useClickOutsideEvent} from '@sanity/ui'
import {format, isBefore, isValid, parse, startOfMinute} from 'date-fns'
import {isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button, Popover, Tab} from '../../../../ui-components'
import {MONTH_PICKER_VARIANT} from '../../../components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../components/inputs/DateInputs/calendar/types'
import {DatePicker} from '../../../components/inputs/DateInputs/DatePicker'
import {LazyTextInput} from '../../../components/inputs/DateInputs/LazyTextInput'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import useTimeZone from '../../../scheduledPublishing/hooks/useTimeZone'
import {ReleaseAvatar} from '../../components/ReleaseAvatar'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument, type ReleaseType} from '../../store'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {getReleaseTone} from '../../util/getReleaseTone'
import {getPublishDateFromRelease, isReleaseScheduledOrScheduling} from '../../util/util'

const dateInputFormat = 'PP HH:mm'

export function ReleaseTypePicker(props: {release: ReleaseDocument}): React.JSX.Element {
  const {release} = props

  const popoverRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const datePickerRef = useRef<HTMLDivElement | null>(null)

  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const {t} = useTranslation()
  const {updateRelease} = useReleaseOperations()

  const [open, setOpen] = useState(false)
  const [releaseType, setReleaseType] = useState<ReleaseType>(release.metadata.releaseType)
  const publishDate = useMemo(() => getPublishDateFromRelease(release) || new Date(), [release])
  const [isUpdating, setIsUpdating] = useState(false)
  const [isIntendedScheduleDateInPast, setIsIntendedScheduleDateInPast] = useState(
    publishDate && isBefore(new Date(publishDate), new Date()),
  )

  const [intendedPublishAt, setIntendedPublishAt] = useState<Date | undefined>(
    publishDate ? new Date(publishDate) : undefined,
  )
  const updatedDate = intendedPublishAt?.toISOString()

  const {timeZone, utcToCurrentZoneDate} = useTimeZone()
  const [currentTimezone, setCurrentTimezone] = useState<string | null>(timeZone.name)

  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(t), [t])

  const close = useCallback(() => {
    // a bit of a hack to make sure the timezone dialog is not immediately closed on out
    // the dialog itself is in the Calendar component who is basically unrealted to this one
    const dialog = document.querySelector('#time-zone')

    if (open && !dialog) {
      const newRelease = {
        ...release,
        metadata: {...release.metadata, intendedPublishAt: updatedDate, releaseType},
      }

      if (!isEqual(newRelease, release)) {
        if (
          releaseType === 'scheduled' &&
          intendedPublishAt &&
          isBefore(intendedPublishAt, new Date())
        )
          return

        setIsUpdating(true)
        updateRelease(newRelease).then(() => {
          setIsUpdating(false)
        })
      }
      setOpen(false)
    }
  }, [open, release, updatedDate, releaseType, intendedPublishAt, updateRelease])

  useClickOutsideEvent(close, () => [
    popoverRef.current,
    buttonRef.current,
    inputRef.current,
    datePickerRef.current,
  ])

  useEffect(() => {
    /** makes sure to wait for the useTimezone has enough time to update
     * and based on that it will update the input value to the current timezone
     */
    if (timeZone.name !== currentTimezone) {
      setCurrentTimezone(timeZone.name)
      if (updatedDate && isValid(new Date(updatedDate))) {
        const currentZoneDate = utcToCurrentZoneDate(new Date(updatedDate))
        setIntendedPublishAt(currentZoneDate)
      }
    }
  }, [currentTimezone, intendedPublishAt, timeZone, updatedDate, utcToCurrentZoneDate])

  const isPublishDateInPast = !!publishDate && isBefore(new Date(publishDate), new Date())
  const isReleaseScheduled = isReleaseScheduledOrScheduling(release)

  const publishDateLabel = useMemo(() => {
    if (release.state === 'published') {
      if (isPublishDateInPast && release.publishAt)
        return tRelease('dashboard.details.published-on', {
          date: format(new Date(publishDate), 'MMM d, yyyy, pp'),
        })

      return tRelease('dashboard.details.published-asap')
    }

    if (releaseType === 'asap') return t('release.type.asap')
    if (releaseType === 'undecided') return t('release.type.undecided')
    const labelDate = publishDate || intendedPublishAt
    if (!labelDate) return null

    return format(new Date(labelDate), `PPpp`)
  }, [
    intendedPublishAt,
    isPublishDateInPast,
    publishDate,
    release.publishAt,
    release.state,
    releaseType,
    t,
    tRelease,
  ])

  const handleButtonReleaseTypeChange = useCallback((pickedReleaseType: ReleaseType) => {
    setReleaseType(pickedReleaseType)
    const nextPublishAt = pickedReleaseType === 'scheduled' ? startOfMinute(new Date()) : undefined
    setIntendedPublishAt(nextPublishAt)
  }, [])

  const handlePublishAtCalendarChange = useCallback((date: Date | null) => {
    if (!date) return

    setIsIntendedScheduleDateInPast(isBefore(date, new Date()))
    setIntendedPublishAt(startOfMinute(new Date(date)))
  }, [])

  const handlePublishAtInputChange = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const parsedDate = parse(event.currentTarget.value, dateInputFormat, new Date())

    if (isValid(parsedDate)) {
      setIsIntendedScheduleDateInPast(isBefore(parsedDate, new Date()))

      setIntendedPublishAt(startOfMinute(parsedDate))
    }
  }, [])

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
              value={intendedPublishAt ? format(intendedPublishAt, dateInputFormat) : undefined}
              onChange={handlePublishAtInputChange}
            />
            <DatePicker
              ref={datePickerRef}
              monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
              calendarLabels={calendarLabels}
              selectTime
              padding={0}
              value={intendedPublishAt}
              onChange={handlePublishAtCalendarChange}
              isPastDisabled
              showTimezone
            />
          </>
        )}
      </Stack>
    )
  }

  const tone =
    release.state === 'published'
      ? 'positive'
      : getReleaseTone({...release, metadata: {...release.metadata, releaseType}})

  const labelContent = useMemo(
    () => (
      <Flex flex={1} gap={2}>
        {isUpdating ? (
          <Spinner size={1} data-testid="updating-release-spinner" />
        ) : (
          <ReleaseAvatar tone={tone} padding={0} />
        )}

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
    [isReleaseScheduled, isUpdating, publishDateLabel, tone],
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
          tone="positive"
          data-testid="published-release-type-label"
          padding={2}
          style={{borderRadius: '999px'}}
        >
          {labelContent}
        </Card>
      ) : (
        <Button
          disabled={isReleaseScheduled || release.state === 'archived'}
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
