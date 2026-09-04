import {CopyIcon} from '@sanity/icons/Copy'
import {EditIcon} from '@sanity/icons/Edit'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {type ButtonTone, Card, Flex, Stack, Text} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {ContextMenuButton} from '../ContextMenuButton'

const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']
const MODES = ['bleed', 'ghost', 'default'] as const
const SIZES = ['default', 'large'] as const

const STATES = [
  {label: 'resting', props: {}},
  {label: 'selected', props: {selected: true}},
  {label: 'loading', props: {loading: true}},
  {label: 'disabled', props: {disabled: true}},
] as const

const documentMenu = (
  <Menu>
    <MenuItem icon={EditIcon} text="Edit" />
    <MenuItem icon={CopyIcon} text="Duplicate" />
    <MenuItem icon={PublishIcon} text="Publish" />
    <MenuDivider />
    <MenuItem icon={TrashIcon} text="Delete" tone="critical" />
  </Menu>
)

/**
 * The studio's "more actions" trigger: the `ui-components` `Button` with the
 * horizontal-ellipsis icon pinned and a shared localized tooltip ("Show more")
 * supplied by default. It re-exposes `mode` (default `bleed`), `tone`, `size`,
 * `selected`, `loading` and `disabled` from `Button`, and is normally passed
 * as the `button` of a `MenuButton`. Rendered inside `TestWrapper` because the
 * tooltip label resolves through studio i18n.
 */
const meta = {
  title: 'Studio/Context Menu Button',
  component: ContextMenuButton,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ContextMenuButton>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Every tone, the three modes at both sizes, and the four interaction states.
 * Only the button chrome changes; the ellipsis and tooltip are fixed.
 */
export const AllVariants: Story = {
  render: () => (
    <Stack gap={5}>
      <Flex align="center" gap={3}>
        {TONES.map((tone) => (
          <Stack gap={3} key={tone}>
            <ContextMenuButton tone={tone} />
            <Text align="center" muted size={0}>
              {tone}
            </Text>
          </Stack>
        ))}
      </Flex>
      <Stack gap={4}>
        {SIZES.map((size) => (
          <Flex align="center" gap={3} key={size}>
            <Text muted size={0} style={{width: 48}}>
              {size}
            </Text>
            {MODES.map((mode) => (
              <Stack gap={3} key={mode}>
                <ContextMenuButton mode={mode} size={size} />
                <Text align="center" muted size={0}>
                  {mode}
                </Text>
              </Stack>
            ))}
          </Flex>
        ))}
      </Stack>
      <Flex align="center" gap={4}>
        {STATES.map(({label, props}) => (
          <Stack gap={3} key={label}>
            <Card border padding={1} radius={2}>
              <ContextMenuButton {...props} />
            </Card>
            <Text align="center" muted size={0}>
              {label}
            </Text>
          </Stack>
        ))}
      </Flex>
    </Stack>
  ),
}

/**
 * The usual composition: the trigger at the trailing edge of a list row,
 * opening a document-actions menu through `MenuButton`. The `play` function
 * opens the menu so the snapshot captures the portaled popover.
 */
export const Open: Story = {
  render: () => (
    <Flex align="flex-start" style={{minHeight: 320}}>
      <Card padding={2} radius={2} shadow={1} style={{width: 360}}>
        <Flex align="center" gap={3} paddingLeft={2}>
          <Stack flex={1} gap={2}>
            <Text size={1} textOverflow="ellipsis" weight="medium">
              Leo Tolstoy
            </Text>
            <Text muted size={0}>
              Author
            </Text>
          </Stack>
          <MenuButton
            button={<ContextMenuButton />}
            id="context-menu-open"
            menu={documentMenu}
            popover={{portal: true}}
          />
        </Flex>
      </Card>
    </Flex>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper suspends until the mock workspace resolves, so wait for the
    // trigger to mount rather than querying synchronously.
    await userEvent.click(await canvas.findByRole('button', {}, {timeout: 10_000}))
    // The menu portals to document.body
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('menuitem', {name: 'Delete'})).toBeVisible(), {
      timeout: 3000,
    })
  },
}
