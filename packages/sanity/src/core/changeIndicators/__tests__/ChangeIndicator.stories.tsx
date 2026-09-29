import {Card, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor} from 'storybook/test'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {ChangeFieldWrapper} from '../ChangeFieldWrapper'
import {ChangeIndicator} from '../ChangeIndicator'
import {ChangeConnectorRoot} from '../overlay/ChangeConnectorRoot'

const NOOP = () => undefined
const TITLE_PATH = ['title']

/**
 * Chromatic sentinel for the form-side change indicator (`ChangeIndicator`,
 * which reports the field to the connector tracker and paints the change bar)
 * and the review-changes-side `ChangeFieldWrapper`, whose only visible output
 * is the connector the overlay draws between the two while review changes is
 * open. Rendered inside `TestWrapper` for layers, i18n and the outer review
 * changes context.
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
  args: {path: TITLE_PATH, hasFocus: false, isChanged: true},
  render: () => (
    <Card padding={4}>
      <VStack gap={4}>
        <VStack gap={2}>
          <Text muted size={1}>
            changed
          </Text>
          <ChangeIndicator path={TITLE_PATH} hasFocus={false} isChanged>
            <TextInput readOnly value="Changed field" />
          </ChangeIndicator>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1}>
            changed + focus
          </Text>
          <ChangeIndicator path={TITLE_PATH} hasFocus isChanged>
            <TextInput readOnly value="Changed field with focus" />
          </ChangeIndicator>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1}>
            changed + hover effect
          </Text>
          <ChangeIndicator path={TITLE_PATH} hasFocus={false} isChanged withHoverEffect>
            <TextInput readOnly value="Changed field with hover effect" />
          </ChangeIndicator>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1}>
            unchanged
          </Text>
          <ChangeIndicator path={TITLE_PATH} hasFocus={false} isChanged={false}>
            <TextInput readOnly value="Unchanged field" />
          </ChangeIndicator>
        </VStack>
      </VStack>
    </Card>
  ),
}

/**
 * A focused, changed field on the form side and its diff on the review changes
 * side inside their own open `ChangeConnectorRoot`, so the overlay draws the
 * connector between them. The positioned wrapper is what the overlay measures
 * offsets against.
 */
export const Connector: Story = {
  args: {path: TITLE_PATH, hasFocus: true, isChanged: true},
  render: () => (
    <div style={{position: 'relative'}}>
      <ChangeConnectorRoot isReviewChangesOpen onOpenReviewChanges={NOOP} onSetFocus={NOOP}>
        <Flex gap={6} padding={4}>
          <VStack gap={2} style={{flex: 1}}>
            <Text muted size={1}>
              form field
            </Text>
            <ChangeIndicator path={TITLE_PATH} hasFocus isChanged>
              <TextInput readOnly value="A brave new title" />
            </ChangeIndicator>
          </VStack>
          <VStack gap={2} style={{flex: 1}}>
            <Text muted size={1}>
              review changes
            </Text>
            <ChangeFieldWrapper path={TITLE_PATH} hasRevertHover={false}>
              <Card border padding={3} radius={2}>
                <Text size={1}>
                  <del>An old title</del> A brave new title
                </Text>
              </Card>
            </ChangeFieldWrapper>
          </VStack>
        </Flex>
      </ChangeConnectorRoot>
    </div>
  ),
  play: async () => {
    // The overlay measures after a frame; wait for the connector path before
    // archiving so the snapshot always includes it.
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-testid="change-connectors-overlay"] path'),
        ).not.toBeNull(),
      {timeout: 5000},
    )
  },
}
