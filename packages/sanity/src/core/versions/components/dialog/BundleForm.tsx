/* eslint-disable no-warning-comments */
/* eslint-disable i18next/no-literal-string */
import {CalendarIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import speakingurl from 'speakingurl'

import {type BundleDocument} from '../../../store/bundles/types'
import {isDraftOrPublished} from '../../util/dummyGetters'
import {BundleIconEditorPicker} from './BundleIconEditorPicker'

export function BundleForm(props: {
  onChange: (params: Partial<BundleDocument>) => void
  value: Partial<BundleDocument>
}): JSX.Element {
  const {onChange, value} = props
  const [showTitleValidation, setShowTitleValidation] = useState(false)

  const iconValue: Partial<BundleDocument> = useMemo(
    () => ({
      icon: value.icon ?? 'cube',
      hue: value.hue ?? 'gray',
    }),
    [value],
  )

  const handleBundleTitleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const title = event.target.value

      if (isDraftOrPublished(title)) {
        setShowTitleValidation(true)
      } else {
        setShowTitleValidation(false)
      }

      onChange({...value, title: title, name: speakingurl(title)})
    },
    [onChange, value],
  )

  const handleBundleDescriptionChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = event.target.value

      onChange({...value, description: v || undefined})
    },
    [onChange, value],
  )

  const handleBundlePublishAtChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const v = event.target.value

      onChange({...value, publishAt: v})
    },
    [onChange, value],
  )

  const handleIconValueChange = useCallback(
    (icon: Partial<BundleDocument>) => {
      onChange({...value, icon: icon.icon, hue: icon.hue})
    },
    [onChange, value],
  )

  return (
    <Stack space={5}>
      <Flex>
        <BundleIconEditorPicker onChange={handleIconValueChange} value={iconValue} />
      </Flex>
      <Stack space={3}>
        {showTitleValidation && (
          <Card tone="critical" padding={3} radius={2}>
            <Text align="center" muted size={1}>
              {/* localize text */}
              Title cannot be "drafts" or "published"
            </Text>
          </Card>
        )}
        <Text size={1} weight="medium">
          {/* localize text */}
          Title
        </Text>
        <TextInput onChange={handleBundleTitleChange} value={value.title} />
      </Stack>

      <Stack space={3}>
        <Text size={1} weight="medium">
          {/* localize text */}
          Description
        </Text>
        <TextArea onChange={handleBundleDescriptionChange} value={value.description} />
      </Stack>

      <Stack space={3}>
        <Text size={1} weight="medium">
          {/* localize text */}
          Schedule for publishing at
        </Text>
        {/** TODO UPDATE WITH REAL INPUT */}
        <TextInput
          onChange={handleBundlePublishAtChange}
          suffix={
            <Box padding={1} style={{border: '1px solid transparent'}}>
              <Button icon={CalendarIcon} mode="bleed" padding={2} />
            </Box>
          }
          value={value.publishAt || ''}
        />
      </Stack>
    </Stack>
  )
}
