import {InfoOutlineIcon} from '@sanity/icons'
import {Card, Flex, Stack, TabList, TabPanel, Text} from '@sanity/ui'
import {addHours, isValid, startOfHour} from 'date-fns'
import {useCallback, useEffect, useState} from 'react'

import {Tab, Tooltip} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import useTimeZone from '../../../scheduledPublishing/hooks/useTimeZone'
import {type EditableReleaseDocument, type ReleaseType} from '../../store/types'
import {ScheduleDatePicker} from '../ScheduleDatePicker'
import {TitleDescriptionForm} from './TitleDescriptionForm'

const RELEASE_TYPES: ReleaseType[] = ['asap', 'scheduled', 'undecided']

/** @internal */
export function ReleaseForm(props: {
  onChange: (params: EditableReleaseDocument) => void
  value: EditableReleaseDocument
}): React.JSX.Element {
  const {onChange, value} = props
  const {releaseType} = value.metadata || {}
  const {t} = useTranslation()

  const {timeZone, utcToCurrentZoneDate} = useTimeZone()
  const [currentTimezone, setCurrentTimezone] = useState<string | null>(timeZone.name)

  const [buttonReleaseType, setButtonReleaseType] = useState<ReleaseType>(releaseType ?? 'asap')

  const [intendedPublishAt, setIntendedPublishAt] = useState<Date | undefined>()

  const handleBundlePublishAtCalendarChange = useCallback(
    (date: Date) => {
      setIntendedPublishAt(date)
      onChange({...value, metadata: {...value.metadata, intendedPublishAt: date.toISOString()}})
    },
    [onChange, value],
  )

  const handleButtonReleaseTypeChange = useCallback(
    (pickedReleaseType: ReleaseType) => {
      setButtonReleaseType(pickedReleaseType)

      // select the start of the next hour
      const nextInputValue = startOfHour(addHours(new Date(), 1))

      if (pickedReleaseType === 'scheduled') {
        setIntendedPublishAt(nextInputValue)
      }

      onChange({
        ...value,
        metadata: {
          ...value.metadata,
          releaseType: pickedReleaseType,
          intendedPublishAt:
            (pickedReleaseType === 'scheduled' && nextInputValue.toISOString()) || undefined,
        },
      })
    },
    [onChange, value],
  )

  const handleTitleDescriptionChange = useCallback(
    (updatedRelease: EditableReleaseDocument) => {
      onChange({
        ...value,
        metadata: {
          ...value.metadata,
          title: updatedRelease.metadata.title,
          description: updatedRelease.metadata.description,
        },
      })
    },
    [onChange, value],
  )

  useEffect(() => {
    /** makes sure to wait for the useTimezone has enough time to update
     * and based on that it will update the input value to the current timezone
     */
    if (timeZone.name !== currentTimezone) {
      setCurrentTimezone(timeZone.name)
      if (intendedPublishAt && isValid(intendedPublishAt)) {
        const currentZoneDate = utcToCurrentZoneDate(intendedPublishAt)
        setIntendedPublishAt(currentZoneDate)
      }
    }
  }, [currentTimezone, intendedPublishAt, timeZone, utcToCurrentZoneDate])

  return (
    <Stack space={5}>
      <Stack space={2} style={{margin: -1}}>
        <Text muted size={1}>
          {t('release.dialog.tooltip.title')}
          <span style={{marginLeft: 10, opacity: 0.5}}>
            <Tooltip
              content={
                <Stack space={3} style={{maxWidth: 320 - 16}}>
                  <Text size={1}>{t('release.dialog.tooltip.description')}</Text>
                  <Text muted size={1}>
                    {t('release.dialog.tooltip.note')}
                  </Text>
                </Stack>
              }
              delay={0}
              placement="right-start"
              portal
            >
              <InfoOutlineIcon />
            </Tooltip>
          </span>
        </Text>
        <Flex gap={1}>
          <Card
            border
            overflow="hidden"
            padding={1}
            style={{borderRadius: 3.5, alignSelf: 'baseline'}}
            tone="inherit"
          >
            <Flex gap={1}>
              <TabList space={0.5}>
                {RELEASE_TYPES.map((type) => (
                  <Tab
                    aria-controls={`release-timing-${type}`}
                    id={`release-timing-${type}-tab`}
                    key={type}
                    onClick={() => handleButtonReleaseTypeChange(type)}
                    selected={buttonReleaseType === type}
                    label={t(`release.type.${type}`)}
                  />
                ))}
              </TabList>
            </Flex>
          </Card>
          {buttonReleaseType === 'scheduled' && (
            <TabPanel
              aria-labelledby="release-timing-at-time-tab"
              flex={1}
              id="release-timing-at-time"
              style={{outline: 'none'}}
              tabIndex={-1}
            >
              <ScheduleDatePicker
                initialValue={intendedPublishAt || new Date()}
                onChange={handleBundlePublishAtCalendarChange}
              />
            </TabPanel>
          )}
        </Flex>
      </Stack>
      <TitleDescriptionForm release={value} onChange={handleTitleDescriptionChange} />
    </Stack>
  )
}
