/* eslint-disable i18next/no-literal-string */
//import {CalendarIcon} from '@sanity/icons'
import {Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {
  FormFieldHeaderText,
  type FormNodeValidation,
  useBundles,
  //useDateTimeFormat,
  //useTranslation,
} from 'sanity'
import speakingurl from 'speakingurl'

//import {type CalendarLabels} from '../../../form/inputs/DateInputs/base/calendar/types'
//import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {type BundleDocument} from '../../../store/bundles/types'
import {isDraftOrPublished} from '../../util/dummyGetters'
import {BundleIconEditorPicker, type BundleIconEditorPickerValue} from './BundleIconEditorPicker'

export function BundleForm(props: {
  onChange: (params: Partial<BundleDocument>) => void
  onError: (errorsExist: boolean) => void
  value: Partial<BundleDocument>
}): JSX.Element {
  const {onChange, onError, value} = props
  const {title, description, icon, hue /*, publishAt*/} = value
  const {current: action} = useRef(value.slug ? 'edit' : 'create')
  const isEditing = action === 'edit'

  //const dateFormatter = useDateTimeFormat()

  const [showDatePicker, setShowDatePicker] = useState(false)

  const [isInitialRender, setIsInitialRender] = useState(true)
  const {data} = useBundles()

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
      icon: icon ?? 'cube',
      hue: hue ?? 'gray',
    }),
    [icon, hue],
  )

  const generateSlugFromTitle = useCallback(
    (pickedTitle: string) => {
      if (isEditing && value.slug) {
        const slug = value.slug
        return {slug, slugExists: false}
      }
      const newSlug = speakingurl(pickedTitle)
      const slugExists = Boolean(data && data.find((bundle) => bundle.slug === newSlug))

      return {slug: newSlug, slugExists}
    },
    [isEditing, value, data],
  )

  const handleBundleTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const pickedTitle = event.target.value
      const {slug: newSlug, slugExists} = generateSlugFromTitle(pickedTitle)
      const isEmptyTitle = pickedTitle.trim() === '' && !isInitialRender

      if (isDraftOrPublished(pickedTitle) || slugExists || (isEmptyTitle && !isInitialRender)) {
        if (isEmptyTitle && !isInitialRender) {
          // if the title is empty and it's not the first opening of the dialog, show an error
          // TODO localize text

          setTitleErrors([{level: 'error', message: 'Bundle needs a name', path: []}])
        }
        if (isDraftOrPublished(pickedTitle)) {
          // if the title is 'drafts' or 'published', show an error
          // TODO localize text
          setTitleErrors([
            {level: 'error', message: "Title cannot be 'drafts' or 'published'", path: []},
          ])
        }
        if (slugExists) {
          // if the bundle already exists, show an error
          // TODO localize text
          setTitleErrors([{level: 'error', message: 'Bundle already exists', path: []}])
        }

        onError(true)
      } else {
        setTitleErrors([])
        onError(false)
      }

      setIsInitialRender(false)
      onChange({...value, title: pickedTitle, slug: newSlug})
    },
    [generateSlugFromTitle, isInitialRender, onChange, onError, value],
  )

  const handleBundleDescriptionChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = event.target.value

      onChange({...value, description: v || undefined})
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
        {/* localize text */}
        <FormFieldHeaderText title="Title" validation={titleErrors} />
        <TextInput
          data-testid="bundle-form-title"
          onChange={handleBundleTitleChange}
          customValidity={titleErrors.length > 0 ? 'error' : undefined}
          value={title}
        />
      </Stack>

      <Stack space={3}>
        <Text size={1} weight="medium">
          {/* localize text */}
          Description
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
