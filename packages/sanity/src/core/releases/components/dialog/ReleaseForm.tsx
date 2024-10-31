import {InfoOutlineIcon} from '@sanity/icons'
import {type FormNodeValidation} from '@sanity/types'
import {Card, Flex, Stack, TabList, TabPanel, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Tab, Tooltip} from '../../../../ui-components'
import {MONTH_PICKER_VARIANT} from '../../../../ui-components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../../ui-components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../../../ui-components/inputs/DateInputs/DateTimeInput'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {useDateTimeFormat} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {type EditableReleaseDocument, type ReleaseType} from '../../../store/release/types'
import {ReleaseInputsForm} from './ReleaseInputsForm'

/** @internal */
export function ReleaseForm(props: {
  onChange: (params: EditableReleaseDocument) => void
  value: EditableReleaseDocument
  isReleaseScheduled?: boolean
}): JSX.Element {
  const {onChange, value, isReleaseScheduled = false} = props
  const {releaseType} = value.metadata || {}
  const publishAt = value.publishAt
  // derive the action from whether the initial value prop has a slug
  // only editing existing releases will provide a value.slug
  const {t} = useTranslation()

  const dateFormatter = useDateTimeFormat()

  // todo: you can create a release without a title, but not without a date if the type is scheduled
  const [dateErrors, setDateErrors] = useState<FormNodeValidation[]>([])

  const [buttonReleaseType, setButtonReleaseType] = useState<ReleaseType>(releaseType ?? 'asap')

  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(t), [t])
  const [inputValue, setInputValue] = useState<string | undefined>(
    publishAt ? dateFormatter.format(new Date(publishAt)) : undefined,
  )

  const handleBundlePublishAtChange = useCallback(
    (date: Date | null) => {
      setInputValue(date ? dateFormatter.format(date) : undefined)
      onChange({...value, metadata: {...value.metadata, intendedPublishAt: date?.toDateString()}})
    },
    [dateFormatter, onChange, value],
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

  const handleTitleDescriotionChange = useCallback(
    (upDatedRlease: EditableReleaseDocument) => {
      onChange({
        ...value,
        metadata: {
          ...value.metadata,
          title: upDatedRlease.metadata.title,
          description: upDatedRlease.metadata.description,
        },
      })
    },
    [onChange, value],
  )

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
                <Tab
                  aria-controls="release-timing-asap"
                  id="release-timing-asap-tab"
                  onClick={() => handleButtonReleaseTypeChange('asap')}
                  label={t('release.type.asap')}
                  selected={buttonReleaseType === 'asap'}
                />
                <Tab
                  aria-controls="release-timing-at-time"
                  id="release-timing-at-time-tab"
                  onClick={() => handleButtonReleaseTypeChange('scheduled')}
                  selected={buttonReleaseType === 'scheduled'}
                  label={t('release.type.scheduled')}
                />
                <Tab
                  aria-controls="release-timing-undecided"
                  id="release-timing-undecided-tab"
                  onClick={() => handleButtonReleaseTypeChange('undecided')}
                  selected={buttonReleaseType === 'undecided'}
                  label={t('release.type.undecided')}
                />
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
              <DateTimeInput
                selectTime
                readOnly={isReleaseScheduled}
                monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
                onChange={handleBundlePublishAtChange}
                calendarLabels={calendarLabels}
                value={publishAt ? new Date(publishAt) : undefined}
                inputValue={inputValue || ''}
                constrainSize={false}
              />
            </TabPanel>
          )}
        </Flex>
      </Stack>
      <ReleaseInputsForm release={value} onChange={handleTitleDescriotionChange} />
    </Stack>
  )
}
