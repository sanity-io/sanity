import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'
import {Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {
  type FormBundleDocument,
  FormFieldHeaderText,
  type FormNodeValidation,
  useDateTimeFormat,
  useTranslation,
} from 'sanity'

import {Button} from '../../../../ui-components'
import {type CalendarLabels} from '../../../../ui-components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../../../ui-components/inputs/DateInputs/DateTimeInput'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {type BundleDocument, type releaseType} from '../../../store/release/types'
import {ReleaseIconEditorPicker, type ReleaseIconEditorPickerValue} from './ReleaseIconEditorPicker'

interface BaseBundleDocument extends Partial<BundleDocument> {
  hue: ColorHueKey
  icon: IconSymbol
}

export const DEFAULT_BUNDLE: BaseBundleDocument = {
  title: '',
  description: '',
  hue: 'gray',
  icon: 'cube',
}

/** @internal */
export function ReleaseForm(props: {
  onChange: (params: FormBundleDocument) => void
  value: FormBundleDocument
}): JSX.Element {
  const {onChange, value} = props
  const {title, description, icon, hue, publishedAt, releaseType} = value
  // derive the action from whether the initial value prop has a slug
  // only editing existing bundles will provide a value.slug
  const {t} = useTranslation()

  const dateFormatter = useDateTimeFormat()

  // todo: figure out if these are needed
  const [titleErrors, setTitleErrors] = useState<FormNodeValidation[]>([])
  const [dateErrors, setDateErrors] = useState<FormNodeValidation[]>([])

  const [buttonReleaseType, setButtonReleaseType] = useState<releaseType>(releaseType ?? 'asap')

  const {t: coreT} = useTranslation()
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(coreT), [coreT])
  const [inputValue, setInputValue] = useState<string | undefined>(
    publishedAt ? dateFormatter.format(new Date(publishedAt)) : undefined,
  )

  const iconValue: ReleaseIconEditorPickerValue = useMemo(
    () => ({
      icon: icon ?? DEFAULT_BUNDLE.icon,
      hue: hue ?? DEFAULT_BUNDLE.hue,
    }),
    [icon, hue],
  )

  const handleBundleTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const pickedTitle = event.target.value
      onChange({
        ...value,
        title: pickedTitle,
      })
    },
    [onChange, value],
  )

  const handleBundleDescriptionChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const {value: descriptionValue} = event.target

      if (typeof descriptionValue !== 'undefined') {
        onChange({...value, description: descriptionValue})
      }
    },
    [onChange, value],
  )

  const handleBundlePublishAtChange = useCallback(
    (date: Date | null) => {
      setInputValue(date ? dateFormatter.format(date) : undefined)
      onChange({...value, publishedAt: date?.toDateString()})
    },
    [dateFormatter, onChange, value],
  )

  const handleIconValueChange = useCallback(
    (pickedIcon: ReleaseIconEditorPickerValue) => {
      onChange({...value, icon: pickedIcon.icon, hue: pickedIcon.hue})
    },
    [onChange, value],
  )

  const handleButtonReleaseTypeChange = useCallback(
    (pickedReleaseType: releaseType) => {
      setButtonReleaseType(pickedReleaseType)
      onChange({...value, releaseType: pickedReleaseType})
    },
    [onChange, value],
  )

  return (
    <Stack space={5}>
      <Flex>
        <ReleaseIconEditorPicker onChange={handleIconValueChange} value={iconValue} />
      </Flex>

      <Stack space={2} style={{margin: -1}}>
        <Flex gap={1}>
          <Button
            mode="bleed"
            onClick={() => handleButtonReleaseTypeChange('asap')}
            selected={buttonReleaseType === 'asap'}
            text={t('release.form.type.asap')}
          />
          <Button
            mode="bleed"
            onClick={() => handleButtonReleaseTypeChange('scheduled')}
            selected={buttonReleaseType === 'scheduled'}
            text={t('release.form.type.scheduled')}
          />
          <Button
            mode="bleed"
            onClick={() => handleButtonReleaseTypeChange('undecided')}
            selected={buttonReleaseType === 'undecided'}
            text={t('release.form.type.undecided')}
          />
        </Flex>

        {buttonReleaseType === 'scheduled' && (
          <DateTimeInput
            selectTime
            onChange={handleBundlePublishAtChange}
            calendarLabels={calendarLabels}
            value={value.publishedAt ? new Date(value.publishedAt) : undefined}
            inputValue={inputValue || ''}
            constrainSize={false}
          />
        )}
      </Stack>

      <Stack space={3}>
        <FormFieldHeaderText title={t('release.form.title')} validation={titleErrors} />
        <TextInput
          data-testid="release-form-title"
          onChange={handleBundleTitleChange}
          customValidity={titleErrors.length > 0 ? 'error' : undefined}
          value={title}
        />
      </Stack>

      <Stack space={3}>
        <Text size={1} weight="medium">
          {t('release.form.description')}
        </Text>
        <TextArea
          onChange={handleBundleDescriptionChange}
          value={description}
          data-testid="release-form-description"
        />
      </Stack>
    </Stack>
  )
}
