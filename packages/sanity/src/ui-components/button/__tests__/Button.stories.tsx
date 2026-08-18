import {AddIcon} from '@sanity/icons/Add'
import {PublishIcon} from '@sanity/icons/Publish'
import {type ButtonTone, Flex, Grid, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {Button} from '../Button'

// Card and tone-related coverage is prioritized while migrating from
// styled-components to vanilla-extract and from @sanity/ui to ui5, since tone
// changes cascade through every component.
const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']
const MODES = ['default', 'ghost', 'bleed'] as const

/**
 * The studio's `ui-components` wrapper around the `@sanity/ui` Button.
 */
const meta = {
  title: 'UI Components/Button',
  component: Button,
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    text: 'Publish changes',
    tone: 'primary',
  },
}

/**
 * Every tone and mode combination, plus disabled and loading states, in one
 * snapshot. This is the tone-cascade sentinel for the ui5 migration.
 */
export const AllVariants: Story = {
  args: {text: 'Button'},
  render: () => (
    <Stack padding={4} gap={5}>
      {MODES.map((mode) => (
        <Stack key={mode} gap={3}>
          <Text muted size={1} weight="medium">
            mode="{mode}"
          </Text>
          <Grid gap={2} gridTemplateColumns={TONES.length} style={{justifyItems: 'start'}}>
            {TONES.map((tone) => (
              <Button key={tone} mode={mode} tone={tone} text={tone} />
            ))}
            {TONES.map((tone) => (
              <Button key={`${tone}-disabled`} disabled mode={mode} tone={tone} text={tone} />
            ))}
            {TONES.map((tone) => (
              <Button key={`${tone}-icon`} icon={PublishIcon} mode={mode} tone={tone} text={tone} />
            ))}
          </Grid>
        </Stack>
      ))}
      <Flex gap={2}>
        <Button loading text="Loading" tone="primary" />
        <Button size="large" text="Large" tone="primary" />
        <Button icon={AddIcon} text={undefined} tooltipProps={null} tone="primary" />
      </Flex>
    </Stack>
  ),
}
