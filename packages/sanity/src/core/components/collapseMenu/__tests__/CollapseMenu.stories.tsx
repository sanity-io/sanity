import {CopyIcon} from '@sanity/icons/Copy'
import {EditIcon} from '@sanity/icons/Edit'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {PublishIcon} from '@sanity/icons/Publish'
import {StarIcon} from '@sanity/icons/Star'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {Button} from '../../../../ui-components/button/Button'
import {CollapseMenu} from '../CollapseMenu'
import {CollapseMenuButton} from '../CollapseMenuButton'

// Each action carries an `aria-label` equal to its text: when the bar collapses
// to icon-only, `CollapseMenu` clones the buttons with `text: undefined`, and
// the label is what keeps the icon buttons named.
const ACTIONS = [
  <CollapseMenuButton aria-label="Edit" icon={EditIcon} key="edit" mode="bleed" text="Edit" />,
  <CollapseMenuButton
    aria-label="Publish"
    icon={PublishIcon}
    key="publish"
    mode="bleed"
    text="Publish"
  />,
  <CollapseMenuButton
    aria-label="Duplicate"
    icon={CopyIcon}
    key="duplicate"
    mode="bleed"
    text="Duplicate"
  />,
  <CollapseMenuButton
    aria-label="Unpublish"
    icon={UnpublishIcon}
    key="unpublish"
    mode="bleed"
    text="Unpublish"
  />,
  <CollapseMenuButton
    aria-label="Add to favorites"
    icon={StarIcon}
    key="favorite"
    mode="bleed"
    text="Add to favorites"
  />,
  <CollapseMenuButton
    aria-label="Delete"
    dividerBefore
    icon={TrashIcon}
    key="delete"
    mode="bleed"
    text="Delete"
    tone="critical"
  />,
]

const WIDTHS = [560, 300, 160]

// The default overflow trigger is a `ContextMenuButton`, which has no accessible
// name; `menuButtonProps.button` swaps in a labelled one.
const overflowButton = (
  <Button
    aria-label="Show more"
    icon={EllipsisHorizontalIcon}
    mode="bleed"
    tooltipProps={{content: 'Show more'}}
  />
)

/**
 * A responsive action bar. `CollapseMenu` measures its children with an
 * `IntersectionObserver` and moves through three phases as the container
 * narrows: every button expanded with its label, buttons collapsed to
 * icon-only, then the ones that still do not fit spilled into an overflow
 * menu behind a "…" trigger. A spilled action keeps its icon, label, tone and
 * `dividerBefore` when it reappears as a menu item. Document and pane headers
 * mount it for their toolbars. Rendered inside `TestWrapper` because the
 * default overflow trigger's tooltip resolves through studio i18n.
 */
const meta = {
  title: 'Core Components/Collapse Menu',
  component: CollapseMenu,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
  args: {children: ACTIONS},
  // Let the IntersectionObserver settle before capturing.
  parameters: {chromatic: {delay: 500}},
} satisfies Meta<typeof CollapseMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The same six actions in three container widths: everything fits, labels
 * drop to icons, most actions spill into the overflow menu.
 */
export const Widths: Story = {
  render: () => (
    <Stack gap={4}>
      {WIDTHS.map((width) => (
        <Stack gap={2} key={width}>
          <Text muted size={0}>
            {width}px
          </Text>
          <Card border padding={1} radius={2} style={{width}}>
            <CollapseMenu gap={1} menuButtonProps={{button: overflowButton}}>
              {ACTIONS}
            </CollapseMenu>
          </Card>
        </Stack>
      ))}
    </Stack>
  ),
}

/**
 * `collapsed` forces the fully collapsed phase regardless of width: every
 * action lives behind the overflow trigger. The `play` function opens the menu
 * so the snapshot shows the spilled items, including the divider before
 * Delete.
 */
export const OverflowMenuOpen: Story = {
  args: {collapsed: true},
  render: () => (
    <Flex align="flex-start" style={{minHeight: 360}}>
      <Card border padding={1} radius={2}>
        <CollapseMenu collapsed gap={1} menuButtonProps={{button: overflowButton}}>
          {ACTIONS}
        </CollapseMenu>
      </Card>
    </Flex>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', {name: 'Show more'}))
    // The menu portals to document.body
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('menuitem', {name: 'Delete'})).toBeVisible(), {
      timeout: 3000,
    })
  },
}
