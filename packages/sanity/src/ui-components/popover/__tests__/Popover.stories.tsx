import {Box, Flex, Grid, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {Button} from '../../button/Button'
import {Popover} from '../Popover'

/**
 * The studio's `ui-components` wrapper around the `@sanity/ui` Popover. The
 * only behavioural difference from the primitive is that `animate` defaults
 * to `true`, so every studio popover animates in unless a nested popover opts
 * out to avoid AnimatePresence conflicts. Everything floating in the studio
 * (menus, hover cards, inline pickers) sits on this surface.
 */
const meta = {
  title: 'UI Components/Popover',
  component: Popover,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

const popoverContent = (
  <Box padding={3} style={{maxWidth: 220}}>
    <Stack gap={3}>
      <Text size={1} weight="medium">
        Popover content
      </Text>
      <Text size={1} muted>
        Animates in by default.
      </Text>
    </Stack>
  </Box>
)

export const Default: Story = {
  render: () => (
    <Flex align="center" justify="center" style={{minHeight: 240}}>
      <Popover content={popoverContent} open placement="bottom" portal>
        <Button mode="ghost" text="Anchor" />
      </Popover>
    </Flex>
  ),
}

const placementContent = (
  <Box padding={3}>
    <Text size={1}>Placement</Text>
  </Box>
)

function PlacementCell(props: {placement: 'top' | 'right' | 'bottom' | 'left'}) {
  return (
    <Flex justify="center" paddingY={5}>
      <Popover content={placementContent} open placement={props.placement} portal>
        <Button mode="ghost" text={props.placement} />
      </Popover>
    </Flex>
  )
}

/**
 * The four cardinal placements, all statically open. The popover computes its
 * position from the anchor; generous spacing keeps the open popovers from
 * overlapping each other.
 */
export const Placements: Story = {
  render: () => (
    <Grid gap={6} gridTemplateColumns={2} paddingX={4} paddingY={6}>
      {(['top', 'right', 'bottom', 'left'] as const).map((placement) => (
        <PlacementCell key={placement} placement={placement} />
      ))}
    </Grid>
  ),
}
