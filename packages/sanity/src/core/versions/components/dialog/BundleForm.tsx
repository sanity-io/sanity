/* eslint-disable i18next/no-literal-string */
import {type ColorHueKey} from '@sanity/color'
import {CalendarIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Select, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useCallback} from 'react'

import {type Bundle} from '../../types'
import {RANDOM_TONES} from '../../util/const'
import {toSlug} from '../../util/dummyGetters'

export function BundleForm(props: {
  onChange: (params: Bundle) => void
  value: Bundle
}): JSX.Element {
  const {onChange, value} = props

  const handleBundleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = event.target.value

    onChange({...value, title: v, name: toSlug(v)})
  }

  const handleBundleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = event.target.value

    onChange({...value, description: v || undefined})
  }

  const handleBundleToneChange = useCallback(
    () => (event: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({...value, tone: (event.target.value || undefined) as ColorHueKey | undefined})
    },
    [onChange, value],
  )

  const handleBundlePublishAtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = event.target.value

    onChange({...value, publishAt: v})
  }

  return (
    <Stack space={5}>
      <Stack space={3}>
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

      <Stack space={3}>
        <Text size={1} weight="medium">
          {/* localize text */}
          Color
        </Text>
        <Flex>
          <Card
            borderTop
            borderLeft
            borderBottom
            flex="none"
            radius={2}
            padding={2}
            style={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            <div
              style={{
                borderRadius: 1,
                width: 17,
                height: 17,
                backgroundColor: `var(--card-badge-${value.tone || 'default'}-icon-color)`,
              }}
            >
              &nbsp;
            </div>
          </Card>
          <Stack flex={1}>
            <Select
              onChange={handleBundleToneChange}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                textTransform: 'capitalize',
              }}
              value={value.tone || ''}
            >
              {RANDOM_TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </Select>
          </Stack>
        </Flex>
      </Stack>
    </Stack>
  )
}
