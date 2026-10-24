import {Card, Text as UiText} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {FieldWrapperRoot} from '../FieldWrapper'
import {Title} from '../TitleField'

const noop = () => undefined

/**
 * Styled-components sentinel for the task form's custom fields: the title
 * textarea with and without a value, and the field wrapper that resets the
 * field header padding and label weight.
 */
function TaskFormFieldsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              title field
            </Text>
            <Card padding={3} border radius={2}>
              <Title value="Review the launch announcement copy" onChange={noop} />
            </Card>
            <Card padding={3} border radius={2}>
              <Title value={undefined} onChange={noop} placeholder="Task title" />
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              field wrapper
            </Text>
            <FieldWrapperRoot data-testid="task-field-wrapper">
              <Card padding={3} border radius={2}>
                <VStack gap={2}>
                  <div data-ui="fieldHeaderContentBox">
                    <label htmlFor="task-assignee">
                      <UiText size={1} weight="medium" as="span">
                        Assigned to
                      </UiText>
                    </label>
                  </div>
                  <UiText id="task-assignee">Doug</UiText>
                </VStack>
              </Card>
            </FieldWrapperRoot>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}

const meta = {
  title: 'Tasks/Form Fields',
  component: TaskFormFieldsStory,
} satisfies Meta<typeof TaskFormFieldsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    // The pane fades in after it has measured itself, so wait for visibility, not presence.
    await waitFor(
      () => expect(body.getByDisplayValue('Review the launch announcement copy')).toBeVisible(),
      {timeout: 5000},
    )
    await expect(body.getByPlaceholderText('Task title')).toBeVisible()
    await expect(body.getByTestId('task-field-wrapper')).toBeVisible()
    await expect(body.getByText('Assigned to')).toBeVisible()
  },
}
