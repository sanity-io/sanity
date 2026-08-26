import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ClipboardIcon} from '@sanity/icons/Clipboard'
import {CopyIcon} from '@sanity/icons/Copy'
import {DocumentIcon} from '@sanity/icons/Document'
import {EditIcon} from '@sanity/icons/Edit'
import {TrashIcon} from '@sanity/icons/Trash'
import {Flex} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {Button} from '../../button/Button'
import {MenuButton} from '../../menuButton/MenuButton'
import {MenuItem} from '../../menuItem/MenuItem'
import {MenuGroup, type MenuGroupProps} from '../MenuGroup'

// @sanity/ui MenuGroup ships no default flyout placement, so an unconfigured
// submenu inherits Popover's `placement="bottom"` and opens directly below its
// own trigger, occluding the items underneath. Studio call sites (e.g.
// UploadDropDownMenu, FieldActionMenuNode) pass a right-first placement whose
// fallbacks lead with `left-start`, so a starved edge flips to the other side
// instead of stacking below.
//
// `animate: true` works around an @sanity/ui 4.0.6 issue: a non-animated
// nested popover inherits the animated outer menu popover's motion variants
// (the studio MenuButton forces `animate`), mounts on the "hidden" variant
// (opacity 0) and never receives the "visible" transition, leaving the flyout
// permanently invisible. Animating the submenu gives it its own transition.
const SUBMENU_POPOVER: MenuGroupProps['popover'] = {
  animate: true,
  placement: 'right-start',
  fallbackPlacements: ['left-start', 'bottom', 'top'],
}

/**
 * A document-actions menu whose long tail is chunked into `MenuGroup`
 * submenus, wrapped in a `MenuButton` so the groups are actually openable.
 */
function MenuGroupStory() {
  return (
    <Flex align="flex-start" justify="center" paddingTop={4} style={{minHeight: 340}}>
      <MenuButton
        id="menu-group-story"
        button={<Button iconRight={ChevronDownIcon} mode="ghost" text="Document actions" />}
        menu={
          <Menu>
            <MenuItem icon={EditIcon} text="Edit" />
            <MenuItem icon={CopyIcon} text="Duplicate" />
            <MenuDivider />
            <MenuGroup icon={DocumentIcon} popover={SUBMENU_POPOVER} text="Export">
              <MenuItem icon={ClipboardIcon} text="Copy document ID" />
              <MenuItem icon={DocumentIcon} text="Export as JSON" />
            </MenuGroup>
            <MenuDivider />
            <MenuGroup
              icon={TrashIcon}
              popover={SUBMENU_POPOVER}
              text="Danger zone"
              tone="critical"
            >
              <MenuItem icon={TrashIcon} text="Delete" tone="critical" />
            </MenuGroup>
          </Menu>
        }
        popover={{portal: true}}
      />
    </Flex>
  )
}

/**
 * The studio's `ui-components` wrapper around the `@sanity/ui` MenuGroup,
 * pinning `fontSize`/`padding` for layout consistency and adding an optional
 * tooltip. A group lives inside a `Menu` and opens its children in a flyout,
 * keeping the top level of a long menu short and scannable. The `play`
 * function opens the menu and the first group so the snapshot captures the
 * flyout.
 */
const meta = {
  title: 'UI Components/Menu Group',
  component: MenuGroupStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof MenuGroupStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', {name: 'Document actions'}))
    // The menu portals to document.body; the group trigger renders as a
    // plain button, not role="menuitem"
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('button', {name: 'Export'})).toBeVisible(), {
      timeout: 3000,
    })
    await userEvent.click(body.getByRole('button', {name: 'Export'}))
    await waitFor(
      () => expect(body.getByRole('menuitem', {name: 'Export as JSON'})).toBeVisible(),
      {timeout: 3000},
    )
  },
}
