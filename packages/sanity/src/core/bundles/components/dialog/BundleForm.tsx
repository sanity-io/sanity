//import {CalendarIcon} from '@sanity/icons'
import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'
import {Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {
  FormFieldHeaderText,
  type FormNodeValidation,
  useTranslation,
  //useDateTimeFormat,
  //useTranslation,
} from 'sanity'

//import {type CalendarLabels} from '../../../form/inputs/DateInputs/base/calendar/types'
//import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {type BundleDocument} from '../../../store/bundles/types'
import {BundleIconEditorPicker, type BundleIconEditorPickerValue} from './BundleIconEditorPicker'
import {useGetBundleSlug} from './getBundleSlug'

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
  const {title, description, icon, hue /*, publishAt*/} = value
  // derive the action from whether the initial value prop has a slug
  // only editing existing bundles will provide a value.slug
  const {current: action} = useRef(value.slug ? 'edit' : 'create')
  const isEditing = action === 'edit'
  const {t} = useTranslation()

  //const dateFormatter = useDateTimeFormat()

  const [showDatePicker, setShowDatePicker] = useState(false)

  const [isInitialRender, setIsInitialRender] = useState(true)

  const [titleErrors, setTitleErrors] = useState<FormNodeValidation[]>([])
  /*const [dateErrors, setDateErrors] = useState<FormNodeValidation[]>([])

  /*const publishAtDisplayValue = useMemo(() => {
    if (!publishAt) return ''
    return dateFormatter.format(new Date(publishAt as Date))
  }, [dateFormatter, publishAt])

  const [displayDate, setDisplayDate] = useState(publishAtDisplayValue)
  const {t: coreT} = useTranslation()
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(coreT), [coreT])*/

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

  const handleOpenDatePicker = useCallback(() => {
    setShowDatePicker(!showDatePicker)
  }, [showDatePicker])

  /*const handleBundlePublishAtChange = useCallback(
    (nextDate: Date | undefined) => {
      onChange({...value, publishAt: nextDate})
      setDisplayDate(dateFormatter.format(new Date(nextDate as Date)))

      setShowDatePicker(false)
    },
    [dateFormatter, onChange, value],
  )

  const handlePublishAtInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const dateValue = event.target.value.trim()

      // there's likely a better way of doing this
      // needs to check that the date is not invalid & not empty
      // in which case it can update the input value but not the actual bundle value
      if (new Date(event.target.value).toString() === 'Invalid Date' && dateValue !== '') {
        // if the date is invalid, show an error
        setDateErrors([
          {
            level: 'error',
            message: 'Should be an empty or valid date',
            path: [],
          },
        ])
        setDisplayDate(dateValue)
        onError(true)
      } else {
        setDateErrors([])
        setDisplayDate(dateValue)
        onChange({...value, publishAt: dateValue})
        onError(false)
      }
    },
    [onChange, value, onError],
  )*/

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

      {/*<Stack space={3}>
        <FormFieldHeaderText title="Schedule for publishing at" validation={dateErrors} />

        <TextInput
          suffix={
            <Popover
              constrainSize
              content={
                <Box overflow="auto">
                  <DatePicker
                    onChange={handleBundlePublishAtChange}
                    calendarLabels={calendarLabels}
                    value={publishAt as Date}
                    selectTime
                  />
                </Box>
              }
              open={showDatePicker}
              placement="bottom-end"
              radius={2}
            >
              <Box padding={1} style={{border: '1px solid transparent'}}>
                <Button
                  icon={CalendarIcon}
                  mode="bleed"
                  padding={2}
                  onClick={handleOpenDatePicker}
                />
              </Box>
            </Popover>
          }
          value={displayDate}
          onChange={handlePublishAtInputChange}
          data-testid="bundle-form-publish-at"
          customValidity={dateErrors.length > 0 ? 'error' : undefined}
        />
      </Stack>*/}
    </Stack>
  )
}
