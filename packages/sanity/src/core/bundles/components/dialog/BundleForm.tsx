/* eslint-disable i18next/no-literal-string */
import {CalendarIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Popover, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  FormFieldHeaderText,
  type FormNodeValidation,
  useBundles,
  useDateTimeFormat,
  useTranslation,
} from 'sanity'
import speakingurl from 'speakingurl'

import {type CalendarLabels} from '../../../form/inputs/DateInputs/base/calendar/types'
import {DatePicker} from '../../../form/inputs/DateInputs/base/DatePicker'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {type BundleDocument} from '../../../store/bundles/types'
import {isDraftOrPublished} from '../../util/dummyGetters'
import {BundleIconEditorPicker, type BundleIconEditorPickerValue} from './BundleIconEditorPicker'

export function BundleForm(props: {
  onChange: (params: Partial<BundleDocument>) => void
  onError: (errorsExist: boolean) => void
  value: Partial<BundleDocument>
}): JSX.Element {
  const {onChange, onError, value} = props
  const {title, description, icon, hue, publishAt} = value

  const dateFormatter = useDateTimeFormat()

  const [showDateValidation, setShowDateValidation] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showBundleExists, setShowBundleExists] = useState(false)
  const [showIsDraftPublishError, setShowIsDraftPublishError] = useState(false)

  const [isInitialRender, setIsInitialRender] = useState(true)
  const {data} = useBundles()

  const [titleErrors, setTitleErrors] = useState<FormNodeValidation[]>([])

  useEffect(() => {
    const newTitleErrors: FormNodeValidation[] = []

    // if the title is 'drafts' or 'published', show an error
    if (showIsDraftPublishError) {
      newTitleErrors.push({
        level: 'error',
        message: "Title cannot be 'drafts' or 'published'",
        path: [],
      })
    }

    // if the bundle already exists, show an error
    if (showBundleExists) {
      newTitleErrors.push({
        level: 'error',
        message: 'Bundle already exists',
        path: [],
      })
    }

    // if the title is empty (but on not first render), show an error
    if (!isInitialRender && title?.length === 0) {
      newTitleErrors.push({
        level: 'error',
        message: 'Bundle needs a name',
        path: [],
      })
    }
    setTitleErrors(newTitleErrors)
  }, [isInitialRender, showBundleExists, showIsDraftPublishError, title?.length])

  const publishAtDisplayValue = useMemo(() => {
    if (!publishAt) return ''
    return dateFormatter.format(new Date(publishAt as Date))
  }, [dateFormatter, publishAt])

  const [displayDate, setDisplayDate] = useState(publishAtDisplayValue)
  const {t: coreT} = useTranslation()
  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(coreT), [coreT])

  const iconValue: BundleIconEditorPickerValue = useMemo(
    () => ({
      icon: icon ?? 'cube',
      hue: hue ?? 'gray',
    }),
    [icon, hue],
  )

  const titleHasErrors = useCallback(
    (pickedTitle: string) => {
      return Boolean(
        isDraftOrPublished(pickedTitle) || // title cannot be "drafts" or "published"
          data?.find((bundle) => bundle.name === speakingurl(pickedTitle)), // bundle already exists
      )
    },
    [data],
  )

  const handleBundleTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const pickedTitle = event.target.value

      if (titleHasErrors(pickedTitle)) {
        if (isDraftOrPublished(pickedTitle)) {
          setShowIsDraftPublishError(true)
        } else {
          setShowIsDraftPublishError(false)
        }

        if (data?.find((bundle) => bundle.name === speakingurl(pickedTitle))) {
          setShowBundleExists(true)
        } else {
          setShowBundleExists(false)
        }
        onError(true)
      } else {
        setShowIsDraftPublishError(false)
        setShowBundleExists(false)
        onError(false)
      }

      setIsInitialRender(false)
      onChange({...value, title: pickedTitle, name: speakingurl(pickedTitle)})
    },
    [data, onChange, onError, titleHasErrors, value],
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

  const handleBundlePublishAtChange = useCallback(
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
        setShowDateValidation(true)
        setDisplayDate(dateValue)
      } else {
        setShowDateValidation(false)
        setDisplayDate(dateValue)
        onChange({...value, publishAt: dateValue})
      }
    },
    [onChange, value],
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

      <Stack space={3}>
        <Text size={1} weight="medium">
          {/* localize text */}
          Schedule for publishing at
        </Text>
        {showDateValidation && (
          <Card tone="critical" padding={3} radius={2}>
            <Text align="center" muted size={1}>
              {/* localize & validate copy & UI */}
              Should be an empty or valid date
            </Text>
          </Card>
        )}

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
        />
      </Stack>
    </Stack>
  )
}
