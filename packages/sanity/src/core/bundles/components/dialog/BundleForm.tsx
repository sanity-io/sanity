import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'
import {Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {
  FormFieldHeaderText,
  type FormNodeValidation,
  useDateTimeFormat,
  useTranslation,
} from 'sanity'

import {type CalendarLabels} from '../../../../ui-components/inputs/DateInputs/calendar/types'
import {DateTimeInput} from '../../../../ui-components/inputs/DateInputs/DateTimeInput'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {type BundleDocument} from '../../../store/bundles/types'
import {BundleIconEditorPicker, type BundleIconEditorPickerValue} from './BundleIconEditorPicker'
import {useGetBundleSlug} from './useGetBundleSlug'

interface BaseBundleDocument extends Partial<BundleDocument> {
  hue: ColorHueKey
  icon: IconSymbol
}

export const DEFAULT_BUNDLE: BaseBundleDocument = {
  slug: '',
  title: '',
  description: '',
  hue: 'gray',
  icon: 'cube',
}

export function BundleForm(props: {
  onChange: (params: Partial<BundleDocument>) => void
  value: Partial<BundleDocument>
}): JSX.Element {
  const {onChange, value} = props
  const {title, description, icon, hue, publishedAt} = value
  // derive the action from whether the initial value prop has a slug
  // only editing existing bundles will provide a value.slug
  const {current: action} = useRef(value.slug ? 'edit' : 'create')
  const isEditing = action === 'edit'
  const {t} = useTranslation()

  const dateFormatter = useDateTimeFormat()

  const [showDatePicker, setShowDatePicker] = useState(false)

  const [isInitialRender, setIsInitialRender] = useState(true)
  const [inputValue, setInputValue] = useState<string | undefined>(undefined)

  const [titleErrors, setTitleErrors] = useState<FormNodeValidation[]>([])
  const [dateErrors, setDateErrors] = useState<FormNodeValidation[]>([])

  const publishAtDisplayValue = useMemo(() => {
    if (!publishedAt) return ''
    return dateFormatter.format(new Date(publishedAt))
  }, [dateFormatter, publishedAt])

  const [displayDate, setDisplayDate] = useState(publishAtDisplayValue)
  const {t: coreT} = useTranslation()
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(coreT), [coreT])

  const iconValue: BundleIconEditorPickerValue = useMemo(
    () => ({
      icon: icon ?? DEFAULT_BUNDLE.icon,
      hue: hue ?? DEFAULT_BUNDLE.hue,
    }),
    [icon, hue],
  )

  const generateSlugFromTitle = useGetBundleSlug()

  const handleBundleTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const pickedTitle = event.target.value
      const {slug: existingSlug} = value

      const nextSlug = (isEditing && existingSlug) || generateSlugFromTitle(pickedTitle)

      onChange({
        ...value,
        title: pickedTitle,
        slug: nextSlug,
      })
    },
    [generateSlugFromTitle, isEditing, onChange, value],
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
    (pickedIcon: BundleIconEditorPickerValue) => {
      onChange({...value, icon: pickedIcon.icon, hue: pickedIcon.hue})
    },
    [onChange, value],
  )

  return (
    <Stack space={5}>
      <Flex>
        <BundleIconEditorPicker onChange={handleIconValueChange} value={iconValue} />
      </Flex>
      <Stack space={3}>
        <FormFieldHeaderText title={t('bundle.form.title')} validation={titleErrors} />
        <TextInput
          data-testid="bundle-form-title"
          onChange={handleBundleTitleChange}
          customValidity={titleErrors.length > 0 ? 'error' : undefined}
          value={title}
        />
      </Stack>

      <Stack space={3}>
        <Text size={1} weight="medium">
          {t('bundle.form.description')}
        </Text>
        <TextArea
          onChange={handleBundleDescriptionChange}
          value={description}
          data-testid="bundle-form-description"
        />
      </Stack>

      <Stack space={3}>
        <FormFieldHeaderText title="Schedule for publishing at" validation={dateErrors} />

        <DateTimeInput
          selectTime
          onChange={handleBundlePublishAtChange}
          calendarLabels={calendarLabels}
          value={value.publishedAt ? new Date(value.publishedAt) : undefined}
          inputValue={inputValue || ''}
        />
      </Stack>
    </Stack>
  )
}
