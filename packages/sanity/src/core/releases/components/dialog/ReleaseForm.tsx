import {type FormNodeValidation} from '@sanity/types'
import {Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../ui-components'
import {MONTH_PICKER_VARIANT} from '../../../../ui-components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../../ui-components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../../../ui-components/inputs/DateInputs/DateTimeInput'
import {FormFieldHeaderText} from '../../../form'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {useDateTimeFormat} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {
  type EditableReleaseDocument,
  type ReleaseDocument,
  type ReleaseType,
} from '../../../store/release/types'

const DEFAULT_METADATA: ReleaseDocument['metadata'] = {
  title: '',
  description: '',
  releaseType: 'asap',
}

/** @internal */
export function ReleaseForm(props: {
  onChange: (params: EditableReleaseDocument) => void
  value: EditableReleaseDocument
  isReleaseScheduled?: boolean
}): JSX.Element {
  const {onChange, value, isReleaseScheduled = false} = props
  const {title, description, releaseType} = value.metadata || {}
  const publishAt = value.publishAt
  // derive the action from whether the initial value prop has a slug
  // only editing existing releases will provide a value.slug
  const {t} = useTranslation()

  const dateFormatter = useDateTimeFormat()

  // todo: figure out if these are needed
  const [titleErrors, setTitleErrors] = useState<FormNodeValidation[]>([])
  const [dateErrors, setDateErrors] = useState<FormNodeValidation[]>([])

  const [buttonReleaseType, setButtonReleaseType] = useState<ReleaseType>(releaseType ?? 'asap')

  const {t: coreT} = useTranslation()
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(coreT), [coreT])
  const [inputValue, setInputValue] = useState<string | undefined>(
    publishAt ? dateFormatter.format(new Date(publishAt)) : undefined,
  )

  const handleReleaseTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const pickedTitle = event.target.value
      onChange({
        ...value,
        metadata: {...value.metadata, title: pickedTitle},
      })
    },
    [onChange, value],
  )

  const handleBundleDescriptionChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const {value: descriptionValue} = event.target

      if (typeof descriptionValue !== 'undefined') {
        onChange({...value, metadata: {...value.metadata, description: descriptionValue}})
      }
    },
    [onChange, value],
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

      <Stack space={3}>
        <FormFieldHeaderText title={t('release.form.title')} validation={titleErrors} />
        <TextInput
          data-testid="release-form-title"
          onChange={handleReleaseTitleChange}
          customValidity={titleErrors.length > 0 ? 'error' : undefined}
          value={title || ''}
        />
      </Stack>

      <Stack space={3}>
        <Text size={1} weight="medium">
          {t('release.form.description')}
        </Text>
        <TextArea
          onChange={handleBundleDescriptionChange}
          value={description || ''}
          data-testid="release-form-description"
        />
      </Stack>
    </Stack>
  )
}
