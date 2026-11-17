import {type Path} from '@sanity/types'
import {Card, Text as UiText, useLayer} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {DivergenceOverlay} from '../DivergenceOverlay'

const PATH: Path = ['title']

function DivergenceOverlayFixture() {
  const layer = useLayer()

  return (
    <VStack gap={3}>
      <Card padding={3} border radius={2}>
        <UiText>Field input the overlay anchors to</UiText>
      </Card>
      <DivergenceOverlay
        $path={PATH}
        $layer={layer}
        padding={3}
        radius={2}
        shadow={2}
        tone="caution"
        data-testid="divergence-overlay"
      >
        <UiText size={1}>This field diverged from the published document.</UiText>
      </DivergenceOverlay>
    </VStack>
  )
}

/**
 * Styled-components sentinel for the divergence overlay card. The anchor
 * positioning only applies where `position-anchor` is supported; otherwise
 * the card flows below the field it annotates.
 */
function DivergenceOverlayStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={3}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            divergence overlay
          </Text>
          <DivergenceOverlayFixture />
        </VStack>
      </Card>
    </TestWrapper>
  )
}

const meta = {
  title: 'Divergence/Overlay',
  component: DivergenceOverlayStory,
} satisfies Meta<typeof DivergenceOverlayStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    // The pane fades in after it has measured itself, so wait for visibility, not presence.
    await waitFor(() => expect(body.getByTestId('divergence-overlay')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('This field diverged from the published document.')).toBeVisible()
  },
}
