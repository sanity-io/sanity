import {Card, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {ChangeFieldWrapper} from '../ChangeFieldWrapper'
import {ChangeIndicator} from '../ChangeIndicator'
import {ChangeConnectorRoot} from '../overlay/ChangeConnectorRoot'

/**
 * The form-side change indicator (`ChangeIndicator`) and the changes-panel-side
 * wrapper (`ChangeFieldWrapper`). Both register with the change indicators
 * tracker `TestWrapper`'s `ChangeConnectorRoot` provides; the connector story
 * mounts its own root with review changes open so the connector between the
 * two ends is drawn.
 */
const meta = {
  title: 'Change Indicators/Change Indicator',
  component: ChangeIndicator,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof ChangeIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {path: ['title'], hasFocus: false, isChanged: true},
  render: () => (
    <Card padding={4}>
      <VStack gap={4}>
        <VStack gap={2}>
          <Text muted size={1}>
            changed
          </Text>
          <ChangeIndicator path={['title']} hasFocus={false} isChanged>
            <TextInput readOnly value="Changed field" />
          </ChangeIndicator>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1}>
            changed + focus
          </Text>
          <ChangeIndicator path={['subtitle']} hasFocus isChanged>
            <TextInput readOnly value="Changed field with focus" />
          </ChangeIndicator>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1}>
            changed + hover effect
          </Text>
          <ChangeIndicator path={['slug']} hasFocus={false} isChanged withHoverEffect>
            <TextInput readOnly value="Changed field with hover effect" />
          </ChangeIndicator>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1}>
            unchanged
          </Text>
          <ChangeIndicator path={['body']} hasFocus={false} isChanged={false}>
            <TextInput readOnly value="Unchanged field" />
          </ChangeIndicator>
        </VStack>
      </VStack>
    </Card>
  ),
}

/**
 * A focused, changed field on the left and its diff wrapper on the right, under
 * a `ChangeConnectorRoot` with review changes open, so the connector between
 * them is drawn into the overlay.
 */
export const Connector: Story = {
  args: {path: ['title'], hasFocus: true, isChanged: true},
  render: () => (
    // The overlay SVG is absolutely positioned and the connector offsets are
    // measured against the nearest positioned ancestor, so the root gets one.
    <div style={{position: 'relative', height: 200}}>
      <ChangeConnectorRoot isReviewChangesOpen onOpenReviewChanges={() => {}} onSetFocus={() => {}}>
        <Flex gap={6} padding={4}>
          <Card flex={1}>
            <ChangeIndicator path={['title']} hasFocus isChanged>
              <TextInput readOnly value="Changed field with focus" />
            </ChangeIndicator>
          </Card>
          <Card flex={1}>
            <ChangeFieldWrapper path={['title']} hasRevertHover={false}>
              <Card border padding={3} radius={2}>
                <Text size={1}>Diff for the changed field</Text>
              </Card>
            </ChangeFieldWrapper>
          </Card>
        </Flex>
      </ChangeConnectorRoot>
    </div>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper mounts its own (closed) ChangeConnectorRoot, so there are two
    // overlays; the connector path is drawn in the one rendered by this story.
    const overlays = await canvas.findAllByTestId('change-connectors-overlay', {}, {timeout: 5000})
    await waitFor(() =>
      expect(overlays.some((overlay) => overlay.querySelector('path') !== null)).toBe(true),
    )
  },
}
