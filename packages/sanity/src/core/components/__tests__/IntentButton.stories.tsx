import {EditIcon} from '@sanity/icons/Edit'
import {type ButtonTone, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {IntentButton} from '../IntentButton'

const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']
const PARAMS = {id: 'author-tolstoy', type: 'author'}

/**
 * The `ui-components` `Button` bound to a router intent ("edit this
 * document", "create this type") instead of an `onClick`. Enabled, it renders
 * `as={IntentLink}`: a real anchor whose `href` the router resolves, so the
 * target can be right-clicked, opened in a new tab or copied. Disabled, it
 * renders `as="a" role="link" aria-disabled="true"` with no `href`. Everything
 * cosmetic passes through to `Button`. Rendered inside `TestWrapper` for the
 * router (with an intents route) that `IntentLink` resolves against.
 */
const meta = {
  title: 'Studio/Intent Button',
  component: IntentButton,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
  args: {intent: 'edit', params: PARAMS, text: 'Edit'},
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * The tone sweep, the enabled anchor beside the disabled `aria-disabled`
 * link, and the button trailing a reference row where it typically lives.
 */
export const AllVariants: Story = {
  render: () => (
    <Stack gap={5}>
      <Flex align="center" gap={3}>
        {TONES.map((tone) => (
          <Stack gap={3} key={tone}>
            <IntentButton intent="edit" params={PARAMS} text="Edit" tone={tone} />
            <Text align="center" muted size={0}>
              {tone}
            </Text>
          </Stack>
        ))}
      </Flex>
      <Flex align="center" gap={4}>
        <Stack gap={3}>
          <IntentButton intent="edit" mode="ghost" params={PARAMS} text="Edit author" />
          <Text align="center" muted size={0}>
            enabled: anchor with href
          </Text>
        </Stack>
        <Stack gap={3}>
          <IntentButton disabled intent="edit" mode="ghost" params={PARAMS} text="Edit author" />
          <Text align="center" muted size={0}>
            disabled: aria-disabled link
          </Text>
        </Stack>
      </Flex>
      <Card padding={2} radius={2} shadow={1} style={{maxWidth: 420}}>
        <Flex align="center" gap={3} paddingLeft={2}>
          <Stack flex={1} gap={2}>
            <Text muted size={0}>
              Author
            </Text>
            <Text size={1} textOverflow="ellipsis" weight="medium">
              Leo Tolstoy
            </Text>
          </Stack>
          <IntentButton
            icon={EditIcon}
            intent="edit"
            mode="ghost"
            params={PARAMS}
            text="Open author"
          />
        </Flex>
      </Card>
    </Stack>
  ),
}
