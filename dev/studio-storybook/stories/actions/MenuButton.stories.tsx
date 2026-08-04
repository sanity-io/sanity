import {ArchiveIcon} from '@sanity/icons/Archive'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ClipboardIcon} from '@sanity/icons/Clipboard'
import {CopyIcon} from '@sanity/icons/Copy'
import {DocumentIcon} from '@sanity/icons/Document'
import {EditIcon} from '@sanity/icons/Edit'
import {EllipsisVerticalIcon} from '@sanity/icons/EllipsisVertical'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {PublishIcon} from '@sanity/icons/Publish'
import {RestoreIcon} from '@sanity/icons/Restore'
import {SearchIcon} from '@sanity/icons/Search'
import {TranslateIcon} from '@sanity/icons/Translate'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Box, Card, Flex, Menu, MenuDivider, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Studio shadows from ui-components (barrel). MenuButton enforces popover animation;
// MenuItem restricts children to keep items single-line; MenuGroup pins layout.
// Menu + MenuDivider are the raw @sanity/ui primitives (no Studio shadow exists).
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {MenuButton} from '../../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {
  MenuGroup,
  type MenuGroupProps,
} from '../../../../packages/sanity/src/ui-components/menuGroup/MenuGroup'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'

// A MenuGroup submenu MUST be told to fly out sideways. @sanity/ui's MenuGroup sets
// no default placement, so it inherits Popover's `placement="bottom"` and stacks the
// flyout directly BELOW its own trigger, occluding the items underneath (see the
// RecommendedGroupedMenu docblock). Every real Studio call site passes this shape:
// right-first, with a flip-to-the-other-side fallback (`left-start`) so a starved edge
// never falls back to stacking below. Mirrors `UploadDropDownMenu`'s MENU_GROUP_POPOVER.
const SUBMENU_POPOVER: MenuGroupProps['popover'] = {
  placement: 'right-start',
  fallbackPlacements: ['left-start', 'bottom', 'top'],
}

const meta: Meta<typeof MenuButton> = {
  title: 'Actions & Commands/MenuButton',
  component: MenuButton,
  parameters: {
    // Deliberate: no controls surface. Every story on this page is a composition (a trigger
    // plus a `Menu` of items), and MenuButton's own props are `id`, `button`, `menu` and
    // `popover`, none of them scalar. An args table here would be decoration, so absence
    // is declared rather than left ambiguous.
    controls: {include: []},
    // The popover portals to document.body; a Card wraps its content and reads the
    // color scheme from React context (useRootTheme), which flows through the portal.
    // No exact-viewport dependency, so keep default padding.
    docs: {
      description: {
        component: [
          'MenuButton is one of the highest-traffic controls in Studio: document actions, the ' +
            'create-document picker and the workspace switcher all live behind one, since a menu ' +
            'is where a product puts everything it could not fit on screen.',
          '',
          '|              |                                                                                                                                                                                                |',
          '| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source       | `packages/sanity/src/ui-components/menuButton/MenuButton.tsx`, the Studio shadow of `@sanity/ui` MenuButton                                                                                    |',
          '| Tier         | CHROME. A menu button is a WAI-ARIA commodity control; the shadow only forces the popover to animate. `Menu` and `MenuDivider` are used raw from `@sanity/ui`                                  |',
          '| Audit        | 🔴 needs-work (`hicks-law`, `choice-overload`, `satisficing`). Studio pickers (create-document, workspace switcher) present as one long flat unordered list with no most-likely-first ordering |',
          '| Illustration | `CurrentFlatMenu` is 15 flat siblings; `RecommendedGroupedMenu` is the same 15 capabilities, 4 in front and the tail in two `MenuGroup` submenus                                               |',
          '| Patterns     | `smart-menu-items` · `action-panel` · `hicks-law` · `choice-overload` · `satisficing`                                                                                                          |',
          '',
          'The trigger and the `Menu` are composed by the caller; the shadow takes care of the ' +
            'popover wiring, so the thing opens, animates and dismisses like every other menu in ' +
            'the app.',
          '',
          'The menu mounts in a portaled popover on `document.body`, so it is never clipped by ' +
            'the pane that owns it. The pair of `…Menu` stories carries the argument this page is ' +
            'making. Read them together: nothing about the component changes between them, only ' +
            'the order and the chunking of what it was handed.',
          '',
          '> **Why it matters:** Fifteen alphabetical siblings is a list somebody declined to ' +
            'design, and it charges every editor a full linear scan on every open. Lead with the ' +
            'handful of most-likely actions and collapse the long tail into `MenuGroup` submenus. ' +
            'Same capabilities, a fraction of the scan cost.',
          '',
          'The last story shows it in context: the "…" document-actions menu parked on a real ' +
            '"Anna Karenina" book row.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'chapter:actions',
    'pattern:smart-menu-items',
    'pattern:action-panel',
    'pattern:hicks-law',
    'pattern:choice-overload',
    'pattern:satisficing',
    'audit:needs-work',
    'source:studio-shadow',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof MenuButton>

/** A small menu. Click the trigger to open the portaled popover. */
export const Default: Story = {
  render: () => (
    <MenuButton
      id="menu-default"
      button={<Button text="Actions" iconRight={ChevronDownIcon} mode="ghost" />}
      menu={
        <Menu>
          <MenuItem text="Edit" icon={EditIcon} />
          <MenuItem text="Duplicate" icon={CopyIcon} />
          <MenuDivider />
          <MenuItem text="Delete" icon={TrashIcon} tone="critical" />
        </Menu>
      }
    />
  ),
}

/** Popover placements: the shadow forwards `popover.placement` to Sanity UI. */
export const Placements: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The menu anchored to its trigger via `popover={{placement}}`. The top row is the ' +
          'complete four-way set of cardinal sides (`top`, `right`, `bottom`, `left`). The ' +
          'bottom row is the `-start` / `-end` alignment pair, which only diverges when the ' +
          'trigger is _wider_ than the menu, so those two triggers are deliberately wide: ' +
          '`bottom-start` pins the menu to the trigger’s left edge, `bottom-end` to its right ' +
          'edge.',
      },
    },
  },
  render: () => {
    const shortMenu = (
      <Menu>
        <MenuItem text="Publish" icon={PublishIcon} />
        <MenuItem text="Unpublish" icon={UnpublishIcon} />
      </Menu>
    )
    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: 40, padding: 24}}>
        {/* Cardinal sides: the complete four-way set. */}
        <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
          {(['top', 'right', 'bottom', 'left'] as const).map((placement) => (
            <div key={placement} style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <MenuButton
                id={`menu-placement-${placement}`}
                button={<Button text={placement} iconRight={ChevronDownIcon} mode="ghost" />}
                popover={{placement}}
                menu={shortMenu}
              />
              <Text align="center" muted size={0}>
                {placement}
              </Text>
            </div>
          ))}
        </div>

        {/* Start / end alignment, only visible when the trigger outsizes the menu, hence the
            wide (240px) triggers against a two-item menu. */}
        <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
          {(['bottom-start', 'bottom-end'] as const).map((placement) => (
            <div
              key={placement}
              style={{display: 'flex', flexDirection: 'column', gap: 6, width: 240}}
            >
              <MenuButton
                id={`menu-placement-${placement}`}
                button={
                  <Button
                    text={placement}
                    iconRight={ChevronDownIcon}
                    mode="ghost"
                    style={{width: 240}}
                  />
                }
                popover={{placement}}
                menu={shortMenu}
              />
              <Text muted size={0}>
                {placement === 'bottom-start'
                  ? 'menu hugs the trigger’s LEFT edge'
                  : 'menu hugs the trigger’s RIGHT edge'}
              </Text>
            </div>
          ))}
        </div>
      </div>
    )
  },
}

/** Sanity UI's Menu ships arrow-key roving focus and typeahead for free. */
export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Open the menu and use ↑/↓ to move, Home/End to jump, type-ahead to match, Enter to ' +
          'activate, Esc to close. This roving-focus behavior is inherent to `@sanity/ui` ' +
          '`Menu`. The audit’s `keyboard-only` gap is about _global_ command reach (Cmd+K), not ' +
          'this local menu, which already holds.',
      },
    },
  },
  render: () => (
    <MenuButton
      id="menu-keyboard"
      button={<Button text="Keyboard menu" iconRight={ChevronDownIcon} mode="ghost" />}
      menu={
        <Menu>
          <MenuItem text="Publish" icon={PublishIcon} hotkeys={['Ctrl', 'Alt', 'P']} />
          <MenuItem text="Duplicate" icon={CopyIcon} hotkeys={['Ctrl', 'Alt', 'D']} />
          <MenuItem text="Delete" icon={TrashIcon} tone="critical" />
        </Menu>
      }
    />
  ),
}

// --- Two-variant illustration: hicks-law / choice-overload / satisficing ---------

/** Current: one long flat unordered menu of 15 items. Every open is a linear scan. */
export const CurrentFlatMenu: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Reproduces the audit finding: fifteen sibling items in one undifferentiated column, ' +
          'roughly alphabetical, with the most common action (Edit) buried among rarely-used ones ' +
          'like Archive, Inspect and Export. No chunking and no priority, which is `hicks-law` and ' +
          '`satisficing` in the flesh.',
      },
    },
  },
  render: () => (
    <MenuButton
      id="menu-flat"
      button={<Button text="Document actions" iconRight={ChevronDownIcon} mode="ghost" />}
      menu={
        <Menu>
          <MenuItem text="Archive" icon={ArchiveIcon} />
          <MenuItem text="Bulk edit" icon={EditIcon} />
          <MenuItem text="Copy document ID" icon={ClipboardIcon} />
          <MenuItem text="Copy document URL" icon={CopyIcon} />
          <MenuItem text="Delete" icon={TrashIcon} />
          <MenuItem text="Duplicate" icon={CopyIcon} />
          <MenuItem text="Edit" icon={EditIcon} />
          <MenuItem text="Export as JSON" icon={DocumentIcon} />
          <MenuItem text="Inspect" icon={SearchIcon} />
          <MenuItem text="Pin to home" icon={EyeOpenIcon} />
          <MenuItem text="Publish" icon={PublishIcon} />
          <MenuItem text="Restore" icon={RestoreIcon} />
          <MenuItem text="Translate" icon={TranslateIcon} />
          <MenuItem text="Unpublish" icon={UnpublishIcon} />
          <MenuItem text="View references" icon={SearchIcon} />
        </Menu>
      }
    />
  ),
}

/** Recommended: most-likely actions first, the long tail chunked into `MenuGroup` submenus. */
export const RecommendedGroupedMenu: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'The fix, and nothing about the component changed. The four everyday actions (Edit, ' +
            'Publish, Duplicate, Unpublish) sit at the top in likelihood order, the rarely-used ' +
            'tail collapses into two `MenuGroup` submenus, and the one destructive action is ' +
            'isolated below a divider. Fifteen capabilities either way; only the scan cost ' +
            'moved.',
          '',
          '**Submenu placement (ledger finding).** Each `MenuGroup` must be given ' +
            '`popover={{placement: "right-start", …}}`. @sanity/ui `MenuGroup` ships _no_ ' +
            'default flyout placement, so an unconfigured submenu inherits `Popover`’s ' +
            '`placement="bottom"` and opens directly below its own trigger, burying Advanced ' +
            'and Delete beneath the Export flyout. This is the raw default rather than a ' +
            'collision-flip of a cramped canvas: the popover portals to `document.body`, ' +
            'unclipped. The fallback list leads with `left-start` so a truly starved right edge ' +
            'flips to the _other side_ instead of stacking below. Every Studio call site ' +
            '(`FieldActionMenuGroup`, `UploadDropDownMenu`) passes this same shape.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <MenuButton
      id="menu-grouped"
      button={<Button text="Document actions" iconRight={ChevronDownIcon} mode="ghost" />}
      menu={
        <Menu>
          <MenuItem text="Edit" icon={EditIcon} />
          <MenuItem text="Publish" icon={PublishIcon} />
          <MenuItem text="Duplicate" icon={CopyIcon} />
          <MenuItem text="Unpublish" icon={UnpublishIcon} />
          <MenuDivider />
          <MenuGroup text="Export" icon={DocumentIcon} popover={SUBMENU_POPOVER}>
            <MenuItem text="Copy document ID" icon={ClipboardIcon} />
            <MenuItem text="Copy document URL" icon={CopyIcon} />
            <MenuItem text="Export as JSON" icon={DocumentIcon} />
            <MenuItem text="Inspect" icon={SearchIcon} />
          </MenuGroup>
          <MenuGroup text="Advanced" icon={EllipsisVerticalIcon} popover={SUBMENU_POPOVER}>
            <MenuItem text="Translate" icon={TranslateIcon} />
            <MenuItem text="Pin to home" icon={EyeOpenIcon} />
            <MenuItem text="View references" icon={SearchIcon} />
            <MenuItem text="Archive" icon={ArchiveIcon} />
            <MenuItem text="Restore" icon={RestoreIcon} />
          </MenuGroup>
          <MenuDivider />
          <MenuItem text="Delete" icon={TrashIcon} tone="critical" />
        </Menu>
      }
    />
  ),
}

/**
 * In context: document actions on a real book row. The "…" button sits at the end of the
 * "Anna Karenina" row, exactly where Studio parks per-document actions in a list; click it
 * and the portaled menu opens with the everyday actions (Edit, Publish, Duplicate, Unpublish)
 * up top and Delete isolated below a divider. This is MenuButton doing its most common job.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card border radius={2} style={{maxWidth: 360}}>
      <Flex align="center" gap={1} padding={2}>
        <Box flex={1} style={{minWidth: 0}}>
          <Stack gap={2}>
            <Text size={1} weight="medium" textOverflow="ellipsis">
              Anna Karenina
            </Text>
            <Text size={0} muted>
              Book · Draft
            </Text>
          </Stack>
        </Box>
        <MenuButton
          id="menu-book-row"
          button={
            <Button
              aria-label="Show document actions"
              icon={EllipsisVerticalIcon}
              mode="bleed"
              tooltipProps={{content: 'Actions'}}
            />
          }
          menu={
            <Menu>
              <MenuItem text="Edit" icon={EditIcon} />
              <MenuItem text="Publish" icon={PublishIcon} hotkeys={['Ctrl', 'Alt', 'P']} />
              <MenuItem text="Duplicate" icon={CopyIcon} />
              <MenuItem text="Unpublish" icon={UnpublishIcon} />
              <MenuDivider />
              <MenuItem text="Delete" icon={TrashIcon} tone="critical" />
            </Menu>
          }
        />
      </Flex>
    </Card>
  ),
}
