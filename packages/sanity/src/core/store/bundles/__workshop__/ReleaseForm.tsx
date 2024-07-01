import {COLOR_HUES} from '@sanity/color'
import {CalendarIcon} from '@sanity/icons'
import {
  Box,
  type ButtonTone,
  Card,
  Flex,
  Select,
  Stack,
  Text,
  TextArea,
  TextInput,
} from '@sanity/ui'
import speakingurl from 'speakingurl'

import {Button} from '../../../../ui-components/button'
import {type BundleDocument} from '../types'

function toSlug(value: string): string {
  return speakingurl(value, {truncate: 200, symbols: true})
}

/**
 * Copy from Prototype, not a final or complete working implementation.
 */
export function ReleaseForm(props: {
  onChange: (params: Partial<BundleDocument>) => void
  value: Partial<BundleDocument>
}) {
  const {onChange, value} = props

  const handleReleaseTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = event.target.value

    onChange({...value, title: v, name: toSlug(v)})
  }

  const handleReleaseDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = event.target.value

    onChange({...value, description: v || undefined})
  }

  const handleReleaseToneChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({...value, tone: (event.target.value || undefined) as ButtonTone | undefined})
  }

  const handleReleasePublishAtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const v = event.target.value

    onChange({...value, publishAt: v})
  }

  return (
    <Stack space={5}>
      <Stack space={3}>
        <Text size={1} weight="medium">
          Title
        </Text>
        <TextInput fontSize={3} onChange={handleReleaseTitleChange} value={value.title} />
      </Stack>

      <Stack space={3}>
        <Text size={1} weight="medium">
          Description
        </Text>
        <TextArea onChange={handleReleaseDescriptionChange} value={value.description} />
      </Stack>

      <Stack hidden space={3}>
        <Text size={1} weight="medium">
          Schedule for publishing at
        </Text>
        <TextInput
          onChange={handleReleasePublishAtChange}
          suffix={
            <Box padding={1} style={{border: '1px solid transparent'}}>
              <Button icon={CalendarIcon} mode="bleed" />
            </Box>
          }
          value={value.publishAt || ''}
        />
      </Stack>

      <Stack space={3}>
        <Text size={1} weight="medium">
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
                backgroundColor: `var(--card-avatar-${value.tone || 'gray'}-bg-color)`,
              }}
            >
              &nbsp;
            </div>
          </Card>
          <Stack flex={1}>
            <Select
              onChange={handleReleaseToneChange}
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              }}
              value={value.tone || ''}
            >
              {COLOR_HUES.map((hue) => (
                <option key={hue} value={hue === 'gray' ? '' : hue}>
                  {hue}
                </option>
              ))}
            </Select>
          </Stack>
        </Flex>
      </Stack>
    </Stack>
  )
}
