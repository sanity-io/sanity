import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {LoadingBlock} from '../LoadingBlock'

/** A fixed-size bordered frame so the block's centring is visible. */
function Region(props: {children: ReactNode}) {
  return (
    <Card border radius={2} style={{height: 140, width: 280}} tone="transparent">
      {props.children}
    </Card>
  )
}

/**
 * A generic loading container: a centred `Spinner` and an optional label. The
 * timing is deliberate anti-flash behaviour: nothing is painted for the first
 * 750ms, then the spinner fades in; with `showText` the label follows after
 * 2000ms and the spinner slides up to make room. `fill` absolutely positions
 * the block over a `position: relative` parent (pane overlays); without it the
 * block stretches to its flow container with a 75px floor. Rendered inside
 * `TestWrapper` because the default "Loading" label resolves through studio
 * i18n. Chromatic captures with animations paused at their end state, so the
 * snapshot shows the settled spinner and label rather than the initial blank.
 */
const meta = {
  title: 'Core Components/Loading Block',
  component: LoadingBlock,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
  parameters: {chromatic: {pauseAnimationAtEnd: true}},
} satisfies Meta<typeof LoadingBlock>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The bare spinner, the spinner with the default label, a custom label, and
 * `fill` covering a taller region the way a pane covers its content while a
 * document resolves.
 */
export const AllVariants: Story = {
  render: () => (
    <Stack gap={4}>
      <Flex gap={4} wrap="wrap">
        <Stack gap={2}>
          <Text muted size={0}>
            spinner only
          </Text>
          <Region>
            <LoadingBlock />
          </Region>
        </Stack>
        <Stack gap={2}>
          <Text muted size={0}>
            showText
          </Text>
          <Region>
            <LoadingBlock showText />
          </Region>
        </Stack>
        <Stack gap={2}>
          <Text muted size={0}>
            custom title
          </Text>
          <Region>
            <LoadingBlock showText title="Fetching documents" />
          </Region>
        </Stack>
      </Flex>
      <Stack gap={2}>
        <Text muted size={0}>
          fill
        </Text>
        <Card border overflow="hidden" radius={2} style={{width: 320}}>
          <Flex
            align="center"
            justify="space-between"
            padding={3}
            style={{borderBottom: '1px solid var(--card-border-color)'}}
          >
            <Stack gap={2}>
              <Text size={1} weight="semibold">
                Anna Karenina
              </Text>
              <Text muted size={0}>
                Book · Draft
              </Text>
            </Stack>
          </Flex>
          <div style={{position: 'relative', height: 200}}>
            <LoadingBlock fill showText title="Loading document" />
          </div>
        </Card>
      </Stack>
    </Stack>
  ),
}
