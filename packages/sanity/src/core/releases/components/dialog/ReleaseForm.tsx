import {type FormNodeValidation} from '@sanity/types'
import {Flex, Stack} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
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

  const {t: coreT} = useTranslation()
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(coreT), [coreT])
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
        <Flex gap={1}>
          <Button
            disabled={isReleaseScheduled}
            mode="bleed"
            onClick={() => handleButtonReleaseTypeChange('asap')}
            selected={buttonReleaseType === 'asap'}
            text={t('release.type.asap')}
          />
          <Button
            disabled={isReleaseScheduled}
            mode="bleed"
            onClick={() => handleButtonReleaseTypeChange('scheduled')}
            selected={buttonReleaseType === 'scheduled'}
            text={t('release.type.scheduled')}
          />
          <Button
            disabled={isReleaseScheduled}
            mode="bleed"
            onClick={() => handleButtonReleaseTypeChange('undecided')}
            selected={buttonReleaseType === 'undecided'}
            text={t('release.type.undecided')}
          />
        </Flex>

        {buttonReleaseType === 'scheduled' && (
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
        )}
      </Stack>
      <ReleaseInputsForm release={value} onChange={handleTitleDescriotionChange} />
    </Stack>
  )
}
