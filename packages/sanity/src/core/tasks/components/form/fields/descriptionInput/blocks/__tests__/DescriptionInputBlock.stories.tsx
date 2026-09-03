import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DescriptionInputBlock} from '../DescriptionInputBlock'

/**
 * Chromatic sentinel for ui5 Box padding on task description blocks
 * (`paddingTop={2} paddingBottom={3}`). Copy is static (no timestamps).
 */
const meta = {
  title: 'Tasks/Description Input Block',
  component: DescriptionInputBlock,
} satisfies Meta<typeof DescriptionInputBlock>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {children: 'Review the hero image crop.'},
  render: () => (
    <Card padding={4} style={{maxWidth: 360}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            short
          </Text>
          <DescriptionInputBlock>Review the hero image crop.</DescriptionInputBlock>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            wrapped
          </Text>
          <DescriptionInputBlock>
            A longer task description that should wrap inside the Box padding so a padding-top or
            padding-bottom regression is visible in Chromatic.
          </DescriptionInputBlock>
        </Stack>
      </Stack>
    </Card>
  ),
}
