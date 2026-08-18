import {Card, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {ElementWithChangeBar} from '../ElementWithChangeBar'

/**
 * Vanilla-extract migration sentinel: the change indicator bar was one of the
 * first components migrated from styled-components to vanilla-extract
 * (`ElementWithChangeBar.css.ts`), so this story guards that styling path.
 * Rendered inside `TestWrapper` because the component needs the review
 * changes context, layers and studio i18n.
 */
const meta = {
  title: 'Change Indicators/Element With Change Bar',
  component: ElementWithChangeBar,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof ElementWithChangeBar>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {isChanged: true, children: null},
  render: () => (
    <Card padding={4}>
      <Stack gap={4}>
        <Stack gap={2}>
          <Text muted size={1}>
            changed
          </Text>
          <ElementWithChangeBar isChanged>
            <TextInput readOnly value="Changed field" />
          </ElementWithChangeBar>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1}>
            changed + focus
          </Text>
          <ElementWithChangeBar hasFocus isChanged>
            <TextInput readOnly value="Changed field with focus" />
          </ElementWithChangeBar>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1}>
            unchanged
          </Text>
          <ElementWithChangeBar isChanged={false}>
            <TextInput readOnly value="Unchanged field" />
          </ElementWithChangeBar>
        </Stack>
      </Stack>
    </Card>
  ),
}
