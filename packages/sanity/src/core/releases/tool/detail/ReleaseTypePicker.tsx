import {type ReleaseType} from '@sanity/client'
import {Card, Stack, TabList, Text, useClickOutsideEvent, useToast} from '@sanity/ui'
import {isBefore} from 'date-fns/isBefore'
import {startOfMinute} from 'date-fns/startOfMinute'
import isEqual from 'lodash-es/isEqual.js'
import {useCallback, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {Popover, Tab} from '../../../../ui-components'
import {MONTH_PICKER_VARIANT} from '../../../components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../components/inputs/DateInputs/calendar/types'
import {DatePicker} from '../../../components/inputs/DateInputs/DatePicker'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'
import {useReleaseTime} from '../../hooks/useReleaseTime'
import {releasesLocaleNamespace} from '../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {getIsScheduledDateInPast} from '../../util/getIsScheduledDateInPast'
import {getReleaseTone} from '../../util/getReleaseTone'
import {
  getPublishDateFromRelease,
  isReleaseScheduledOrScheduling,
  type NotArchivedRelease,
} from '../../util/util'
import {ReleaseDateInput} from './ReleaseDateInput'

// The Schedule value reads as plain text (matching the other property values), but stays clickable
// to open the picker: a flush, chrome-free button that only underlines on hover — no pill, and its
// text sits on the same left edge as every other value.
const ScheduleTrigger = styled.button`
  appearance: none;
  background: none;
  border: 0;
  margin: 0;
  padding: 0;
  display: block;
  width: 100%;
  min-width: 0;
  text-align: left;
  color: inherit;
  font: inherit;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`

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
            title: t('release.schedule-dialog.publish-date-in-past-warning'),
          })
        } else {
          setIsUpdating(true)
          void updateRelease(newRelease).finally(() => {
            setIsUpdating(false)
          })
        }
      }

      setOpen(false)
    }
  }, [open, release, updatedDate, releaseType, toast, t, updateRelease])

  useClickOutsideEvent(close, () => [
    popoverRef.current,
    buttonRef.current,
    inputRef.current,
    datePickerRef.current,
  ])

  const isPublishDateInPast = !!publishDate && isBefore(new Date(publishDate), new Date())
  const isReleaseScheduled = isReleaseScheduledOrScheduling(release)

  // A compact, single-line label for the properties-panel value: no seconds, and no
  // "Estimated ·"/"Scheduled ·" prefix (the row's leading glyph + label already convey the type).
  const label = useMemo(() => {
    if (release.state === 'published') {
      return isPublishDateInPast && publishDate
        ? tRelease('dashboard.details.published-on', {
            date: getReleaseTime(release, {compact: true}),
          })
        : tRelease('dashboard.details.published-asap')
    }
    if (release.metadata.releaseType === 'asap') return t('release.type.asap')
    if (release.metadata.releaseType === 'undecided') return t('release.type.undecided')
    return getReleaseTime(release, {compact: true}) ?? t('release.type.scheduled')
  }, [getReleaseTime, isPublishDateInPast, publishDate, release, t, tRelease])

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

  const handlePublishAtCalendarChange = useCallback((date: Date | null) => {
    if (!date) return

    const cleanDate = startOfMinute(new Date(date))
    setIsIntendedScheduleDateInPast(isBefore(cleanDate, new Date()))
    setIntendedPublishAt(cleanDate)
  }, [])

  const handleOnPickerClick = () => {
    if (open) close()
    else setOpen(true)
  }

  const tone = release.state === 'published' ? 'positive' : getReleaseTone(release)

  const valueText = (
    <Text
      data-testid="release-type-label"
      size={1}
      weight="medium"
      textOverflow="ellipsis"
      title={label}
      style={{opacity: isUpdating ? 0.5 : 1}}
    >
      {label}
    </Text>
  )

  return (
    <Popover
      content={
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
                  <Text size={1}>{t('release.schedule-dialog.publish-date-in-past-warning')}</Text>
                </Card>
              )}
              <ReleaseDateInput
                setIsIntendedScheduleDateInPast={setIsIntendedScheduleDateInPast}
                setIntendedPublishAt={setIntendedPublishAt}
                intendedPublishAt={intendedPublishAt}
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
                showTimeZone
                timeZoneScope={CONTENT_RELEASES_TIME_ZONE_SCOPE}
              />
            </>
          )}
        </Stack>
      }
      open={open}
      padding={1}
      placement="bottom-start"
      ref={popoverRef}
    >
      {/* The tone-scoped Card (transparent bg) colours the value text; no filled pill. When the
          schedule is editable it's a flush, chrome-free clickable trigger; when locked/published
          it's static text. Either way it reads as plain text aligned with the other values. */}
      {release.state === 'published' || isReleaseScheduled ? (
        <Card
          tone={tone}
          padding={0}
          style={{background: 'transparent'}}
          data-testid={
            release.state === 'published' ? 'published-release-type-label' : 'release-type-picker'
          }
        >
          {valueText}
        </Card>
      ) : (
        <Card tone={tone} padding={0} style={{background: 'transparent'}}>
          <ScheduleTrigger
            ref={buttonRef}
            onClick={handleOnPickerClick}
            data-testid="release-type-picker"
          >
            {valueText}
          </ScheduleTrigger>
        </Card>
      )}
    </Popover>
  )
}
