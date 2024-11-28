import {LockIcon} from '@sanity/icons'
import {Flex, Spinner, Stack, TabList, Text, useClickOutsideEvent} from '@sanity/ui'
import {format, isBefore, isValid} from 'date-fns'
import {isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button, Popover, Tab} from '../../../../ui-components'
import {MONTH_PICKER_VARIANT} from '../../../../ui-components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../../ui-components/inputs/DateInputs/calendar/types'
import {DatePicker} from '../../../../ui-components/inputs/DateInputs/DatePicker'
import {LazyTextInput} from '../../../../ui-components/inputs/DateInputs/LazyTextInput'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import useTimeZone from '../../../scheduledPublishing/hooks/useTimeZone'
import {ReleaseAvatar} from '../../components/ReleaseAvatar'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument, type ReleaseType} from '../../store'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {getReleaseTone} from '../../util/getReleaseTone'
import {getPublishDateFromRelease, isReleaseScheduledOrScheduling} from '../../util/util'

export function ReleaseTypePicker(props: {release: ReleaseDocument}): JSX.Element {
  const {release} = props

  const popoverRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const datePickerRef = useRef<HTMLDivElement | null>(null)

  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const {t} = useTranslation()
  const {updateRelease} = useReleaseOperations()

  const [open, setOpen] = useState(false)
  const [dateInputOpen, setDateInputOpen] = useState(release.metadata.releaseType === 'scheduled')
  const [releaseType, setReleaseType] = useState<ReleaseType>(release.metadata.releaseType)
  const publishDate = useMemo(() => getPublishDateFromRelease(release) || new Date(), [release])

  const [updatedDate, setUpdatedDate] = useState<string | undefined>(publishDate.toDateString())
  const [isUpdating, setIsUpdating] = useState(false)

  const [inputValue, setInputValue] = useState<Date | undefined>(
    publishDate ? new Date(publishDate) : undefined,
  )

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
        setIsUpdating(true)
        updateRelease(newRelease).then(() => {
          setIsUpdating(false)
        })
        setDateInputOpen(releaseType === 'scheduled')
      }
      setOpen(false)
    }
  }, [open, updateRelease, release, updatedDate, releaseType])

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
        setInputValue(currentZoneDate)
      }
    }
  }, [currentTimezone, inputValue, timeZone, updatedDate, utcToCurrentZoneDate])

  const isPublishDateInPast = !!publishDate && isBefore(new Date(publishDate), new Date())
  const isReleaseScheduled = isReleaseScheduledOrScheduling(release)

  const publishDateLabel = useMemo(() => {
    if (releaseType === 'asap') return t('release.type.asap')
    if (releaseType === 'undecided') return t('release.type.undecided')
    const labelDate = publishDate || inputValue
    if (!labelDate) return null

    if (isPublishDateInPast && release.publishAt)
      return tRelease('dashboard.details.published-on', {
        date: format(new Date(publishDate), 'MMM d, yyyy'),
      })

    return format(new Date(labelDate), `PPpp`)
  }, [inputValue, isPublishDateInPast, publishDate, release.publishAt, releaseType, t, tRelease])

  const handleButtonReleaseTypeChange = useCallback((pickedReleaseType: ReleaseType) => {
    if (pickedReleaseType === 'scheduled') {
      setDateInputOpen(true)
    }

    setReleaseType(pickedReleaseType)
    const nextPublishAt = pickedReleaseType === 'scheduled' ? new Date() : undefined
    setUpdatedDate(nextPublishAt?.toISOString())
    setInputValue(nextPublishAt)
  }, [])

  const handleBundlePublishAtChange = useCallback((date: Date | null) => {
    if (!date) return

    setInputValue(new Date(date))

    setUpdatedDate(date ? date.toISOString() : undefined)
  }, [])

  const handleInputChange = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const parsedDate = new Date(event.currentTarget.value)

    if (isValid(parsedDate)) {
      setInputValue(parsedDate)

      setUpdatedDate(parsedDate.toISOString())
    }
  }, [])

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
        {dateInputOpen && (
          <>
            <LazyTextInput
              value={inputValue ? format(inputValue, 'PPp') : undefined}
              onChange={handleInputChange}
              readOnly
            />

            <DatePicker
              ref={datePickerRef}
              monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
              calendarLabels={calendarLabels}
              selectTime
              padding={0}
              value={inputValue}
              onChange={handleBundlePublishAtChange}
              showTimezone
            />
          </>
        )}
      </Stack>
    )
  }

  return (
    <Popover
      content={<PopoverContent />}
      open={open}
      padding={1}
      placement="bottom-start"
      ref={popoverRef}
    >
      <Button
        disabled={
          isReleaseScheduled || release.state === 'archived' || release.state === 'published'
        }
        mode="bleed"
        onClick={() => setOpen(!open)}
        padding={2}
        ref={buttonRef}
        tooltipProps={{
          placement: 'bottom',
          content: isReleaseScheduled && tRelease('type-picker.tooltip.scheduled'),
        }}
        selected={open}
        tone={getReleaseTone({...release, metadata: {...release.metadata, releaseType}})}
        style={{borderRadius: '999px'}}
      >
        <Flex flex={1} gap={2}>
          {isUpdating ? (
            <Spinner size={1} />
          ) : (
            <ReleaseAvatar
              tone={getReleaseTone({...release, metadata: {...release.metadata, releaseType}})}
              padding={0}
            />
          )}

          <Text muted size={1} weight="medium">
            {publishDateLabel}
          </Text>

          {isReleaseScheduled && (
            <Text size={1}>
              <LockIcon />
            </Text>
          )}
        </Flex>
      </Button>
    </Popover>
  )
}
