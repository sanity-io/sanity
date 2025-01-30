import {EarthGlobeIcon, InfoOutlineIcon} from '@sanity/icons'
import {Card, Flex, Stack, TabList, TabPanel, Text} from '@sanity/ui'
import {format, isValid} from 'date-fns'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {Button, Tab, Tooltip} from '../../../../ui-components'
import {MONTH_PICKER_VARIANT} from '../../../components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../../components/inputs/DateInputs/DateTimeInput'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {useTranslation} from '../../../i18n'
import useDialogTimeZone from '../../../scheduledPublishing/hooks/useDialogTimeZone'
import useTimeZone from '../../../scheduledPublishing/hooks/useTimeZone'
import {type EditableReleaseDocument, type ReleaseType} from '../../store/types'
import {TitleDescriptionForm} from './TitleDescriptionForm'

const RELEASE_TYPES: ReleaseType[] = ['asap', 'scheduled', 'undecided']

/** @internal */
export function ReleaseForm(props: {
  onChange: (params: EditableReleaseDocument) => void
  value: EditableReleaseDocument
}): React.JSX.Element {
  const {onChange, value} = props
  const {releaseType} = value.metadata || {}
  const publishAt = value.metadata.intendedPublishAt
  const {t} = useTranslation()

  const {DialogTimeZone, dialogProps, dialogTimeZoneShow} = useDialogTimeZone()
  const {timeZone, utcToCurrentZoneDate} = useTimeZone()
  const [currentTimezone, setCurrentTimezone] = useState<string | null>(timeZone.name)

  const [buttonReleaseType, setButtonReleaseType] = useState<ReleaseType>(releaseType ?? 'asap')

  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(t), [t])
  const [inputValue, setInputValue] = useState<Date>(publishAt ? new Date(publishAt) : new Date())

  const handleBundlePublishAtCalendarChange = useCallback(
    (date: Date | null) => {
      if (!date) return

      setInputValue(date)
      onChange({...value, metadata: {...value.metadata, intendedPublishAt: date.toISOString()}})
    },
    [onChange, value],
  )

  const handleButtonReleaseTypeChange = useCallback(
    (pickedReleaseType: ReleaseType) => {
      setButtonReleaseType(pickedReleaseType)
      onChange({
        ...value,
        metadata: {...value.metadata, releaseType: pickedReleaseType, intendedPublishAt: undefined},
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
      if (isValid(inputValue)) {
        const currentZoneDate = utcToCurrentZoneDate(inputValue)
        setInputValue(currentZoneDate)
      }
    }
  }, [currentTimezone, inputValue, timeZone, utcToCurrentZoneDate])

  return (
    <Stack space={5}>
      <Stack space={2} style={{margin: -1}}>
        <Text muted size={1}>
          {t('release.dialog.tooltip.title')}
          <span style={{marginLeft: 10, opacity: 0.5}}>
            <Tooltip
              content={
                <Stack space={4} style={{maxWidth: 320 - 16}}>
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
          <Card border overflow="hidden" padding={1} style={{borderRadius: 3.5}} tone="inherit">
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
              <Flex flex={1} justify="space-between">
                <DateTimeInput
                  selectTime
                  monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
                  onChange={handleBundlePublishAtCalendarChange}
                  calendarLabels={calendarLabels}
                  value={inputValue}
                  inputValue={format(inputValue, 'PPp')}
                  constrainSize={false}
                  padding={0}
                  readOnly
                />

                <Button
                  icon={EarthGlobeIcon}
                  mode="bleed"
                  size="default"
                  text={`${timeZone.abbreviation}`}
                  onClick={dialogTimeZoneShow}
                />
              </Flex>
            </TabPanel>
          )}
        </Flex>
      </Stack>
      <TitleDescriptionForm release={value} onChange={handleTitleDescriptionChange} />

      {DialogTimeZone && <DialogTimeZone {...dialogProps} />}
    </Stack>
  )
}
