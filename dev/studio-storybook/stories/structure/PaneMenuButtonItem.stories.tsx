import {EditIcon} from '@sanity/icons/Edit'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {LaunchIcon} from '@sanity/icons/Launch'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Card, Menu, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from its real path (org contract §8).
import {PaneMenuButtonItem} from '../../../../packages/sanity/src/structure/components/pane/PaneMenuButtonItem'
import {
  type _PaneMenuGroup,
  type _PaneMenuItem,
  type _PaneMenuNode,
} from '../../../../packages/sanity/src/structure/components/pane/types'
import {WithStudioProviders} from '../../lib/testProvider'

const meta: Meta<typeof PaneMenuButtonItem> = {
  title: 'Document Pane/Menu Button Item',
  component: PaneMenuButtonItem,
  decorators: [WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        component: [
          'Two sibling renderers, forty lines apart in the same file, disagree about what to do ' +
            'when a menu row is both selected and carries its own trailing icon. One drops the ' +
            'custom icon; the other drops the checkmark. Same menu, same visual row, opposite ' +
            'resolution.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/structure/components/pane/PaneMenuButtonItem.tsx` |',
          '| Tier | SERVICE. It draws almost nothing itself. It reads the node type and recurses, ending at one of two sibling leaf renderers |',
          '| Audit | 🟡 needs-work (`menu-item`, `selection-indicator`) |',
          '| Patterns | `menu-item` · `selection-indicator` |',
          '',
          'Every row in a document pane context menu passes through here. The structure builder ' +
            'describes a tree of items, groups and dividers; this component turns that ' +
            'description into menu rows, calling itself for each child.',
          '',
          'It is genuinely recursive: a group renders this component for each of its children, so ' +
            'a three-level menu is three levels of itself. The stories below mount it directly ' +
            'inside a bare menu, because the recursion is the interesting part and a real pane ' +
            'would bury it.',
          '',
          'The five returns, quoted:',
          '',
          '| Line | Condition | Renders |',
          '| --- | --- | --- |',
          '| 27 | `node.type === "divider"` | `<MenuDivider />` |',
          '| 34 | group with `children.length === 0` | `null` |',
          '| 38 | group, `expanded` | the children inlined, under an optional label |',
          '| 58 | group, not expanded | a `MenuGroup` that opens a submenu |',
          '| 80 | anything else (an item) | hands off to a resolver |',
          '',
          'The resolver then splits once more, on whether the item carries an intent: an item ' +
            'with an intent becomes a real link with an href, and everything else becomes a plain ' +
            'menu row. Two components, visually identical by design, sitting in the same menu.',
          '',
          '> **Why it matters:** the plain-row renderer lets a custom trailing icon win and drops ' +
            'the checkmark; the intent-row renderer lets the checkmark win and drops the custom ' +
            'icon. An author who sets a trailing icon on a selected item gets a different result ' +
            'depending on a property that has nothing to do with icons, whether the row happens ' +
            'to navigate. The selection-indicator-conflict story puts the two side by side with ' +
            'identical node descriptions, so the divergence is visible rather than described.',
          '',
          'A second, smaller asymmetry: the plain-row renderer carries a test id built from the ' +
            "item's title. The intent-row renderer carries no test id at all. Every intent-driven " +
            'row in every pane menu, which is to say every row that actually navigates somewhere, ' +
            'is unaddressable from a test that selects by test id.',
          '',
          'On the divider that follows a group: the caller passes that flag in, and three of the ' +
            'five returns begin by conditionally rendering a divider. The component never ' +
            'computes it for itself at the top level; a group computes it for its own children by ' +
            'checking whether the previous sibling was itself a group. So a divider appears after ' +
            'a group ends, and the first child of a menu never gets one.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:structure',
    'pattern:menu-item',
    'pattern:selection-indicator',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof PaneMenuButtonItem>

/* ── Fixtures ──────────────────────────────────────────────────────────────
   The component's input is a `_PaneMenuNode`. It reads `type` and dispatches,
   so the fixture must describe a node and must NOT pre-decide which branch is
   taken: that decision is the component's job (the fixture rule). */

const item = (over: Partial<_PaneMenuItem> & {key: string; title: string}): _PaneMenuItem => ({
  type: 'item',
  icon: EditIcon,
  onAction: () => {},
  renderAsButton: false,
  ...over,
})

const group = (over: Partial<_PaneMenuGroup> & {key: string}): _PaneMenuGroup => ({
  type: 'group',
  expanded: false,
  children: [],
  renderAsButton: false,
  ...over,
})

/** A menu shell. `MenuItem` and `MenuGroup` read the `Menu` context for keyboard navigation. */
function MenuStage({children, note}: {children: React.ReactNode; note?: string}) {
  return (
    <Stack gap={3}>
      {note && (
        <Text size={1} muted>
          {note}
        </Text>
      )}
      <Card radius={2} shadow={2} style={{maxWidth: 320}}>
        <Menu>{children}</Menu>
      </Card>
    </Stack>
  )
}

/** The item branch (line 80), no intent, so `PaneContextMenuItem`. */
export const PlainItem: Story = {
  render: () => (
    <MenuStage note="One item, no intent. The resolver picks the plain renderer.">
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={item({key: 'publish', title: 'Publish', icon: PublishIcon, hotkey: 'Ctrl+Alt+P'})}
      />
    </MenuStage>
  ),
}

/** The divider branch (line 27). The whole node is two fields and it renders a rule. */
export const Divider: Story = {
  render: () => (
    <MenuStage note="A divider node. The earliest return, and the only one that reads nothing but `type`.">
      <PaneMenuButtonItem isAfterGroup={false} node={item({key: 'edit', title: 'Edit'})} />
      <PaneMenuButtonItem isAfterGroup={false} node={{type: 'divider', key: 'd1'}} />
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={item({key: 'delete', title: 'Delete', icon: TrashIcon, tone: 'critical'})}
      />
    </MenuStage>
  ),
}

/**
 * The empty-group branch (line 34). Renders `null`, so this story is deliberately a picture of
 * nothing between two real rows. A group whose children were all filtered out upstream leaves no
 * trace: no heading, no empty state, not even the divider its `isAfterGroup` would have earned.
 */
export const EmptyGroupRendersNothing: Story = {
  render: () => (
    <MenuStage note="There is an empty group between these two rows. It renders null, so the menu closes over the gap with no sign anything was there.">
      <PaneMenuButtonItem isAfterGroup={false} node={item({key: 'edit', title: 'Edit'})} />
      <PaneMenuButtonItem
        isAfterGroup
        node={group({key: 'empty', title: 'Nothing survived', children: []})}
      />
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={item({key: 'view', title: 'View', icon: EyeOpenIcon})}
      />
    </MenuStage>
  ),
}

/** The expanded-group branch (line 38): children inlined under a label, recursion one level deep. */
export const ExpandedGroup: Story = {
  render: () => (
    <MenuStage note="`expanded: true`. The children are inlined under a label and the component has called itself three times.">
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={group({
          key: 'lifecycle',
          title: 'Lifecycle',
          expanded: true,
          children: [
            item({key: 'publish', title: 'Publish', icon: PublishIcon}),
            item({key: 'unpublish', title: 'Unpublish', icon: UnpublishIcon}),
            item({key: 'delete', title: 'Delete', icon: TrashIcon, tone: 'critical'}),
          ],
        })}
      />
    </MenuStage>
  ),
}

/** The collapsed-group branch (line 58): the same children behind a submenu. */
export const CollapsedGroup: Story = {
  render: () => (
    <MenuStage note="The identical node with `expanded: false`. Same children, now one hover away.">
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={group({
          key: 'lifecycle',
          title: 'Lifecycle',
          icon: PublishIcon,
          expanded: false,
          children: [
            item({key: 'publish', title: 'Publish', icon: PublishIcon}),
            item({key: 'unpublish', title: 'Unpublish', icon: UnpublishIcon}),
            item({key: 'delete', title: 'Delete', icon: TrashIcon, tone: 'critical'}),
          ],
        })}
      />
    </MenuStage>
  ),
}

/**
 * `disabled` accepts `true` or `{reason}`. Only the object form produces a tooltip, and the
 * component's own `disabled` prop ORs with the node's, so a disabled group disables its children
 * without any of them saying so.
 */
export const DisabledWithAndWithoutReason: Story = {
  render: () => (
    <MenuStage note="Top row is `disabled: true`. Second is `disabled: {reason}` and explains itself on hover. Third inherits from a disabled parent group and cannot explain anything.">
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={item({key: 'a', title: 'Unpublish', icon: UnpublishIcon, disabled: true})}
      />
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={item({
          key: 'b',
          title: 'Delete',
          icon: TrashIcon,
          tone: 'critical',
          disabled: {reason: 'This document is referenced by 3 others.'},
        })}
      />
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={group({
          key: 'inherited',
          title: 'Disabled group',
          expanded: true,
          disabled: true,
          children: [item({key: 'c', title: 'Duplicate', icon: EditIcon})],
        })}
      />
    </MenuStage>
  ),
}

/**
 * **The finding.** Four rows, two node descriptions, differing only in whether an `intent` is
 * present. Both are `selected`. Both set their own `iconRight`.
 *
 * The plain rows keep their custom icon and lose the checkmark. The intent rows keep the checkmark
 * and lose their custom icon. Nothing in the type system or the docs says which should win, and
 * the two renderers are forty lines apart in the same file.
 */
export const SelectionIndicatorConflict: Story = {
  render: () => {
    const selectedWithOwnIcon: Omit<_PaneMenuItem, 'key' | 'intent'> = {
      type: 'item',
      title: 'Open in preview',
      icon: EyeOpenIcon,
      iconRight: LaunchIcon,
      selected: true,
      onAction: () => {},
      renderAsButton: false,
    }
    const nodes: _PaneMenuNode[] = [
      {...selectedWithOwnIcon, key: 'plain-selected'},
      {...selectedWithOwnIcon, key: 'plain-unselected', selected: false},
      {
        ...selectedWithOwnIcon,
        key: 'intent-selected',
        intent: {type: 'edit', params: {id: 'article-1', type: 'article'}},
      },
      {
        ...selectedWithOwnIcon,
        key: 'intent-unselected',
        selected: false,
        intent: {type: 'edit', params: {id: 'article-1', type: 'article'}},
      },
    ]
    return (
      <Stack gap={3}>
        <Text size={1} muted>
          Rows 1 and 2 have no intent. Rows 3 and 4 are identical except that they do. Every row
          sets `iconRight: LaunchIcon`; rows 1 and 3 are also `selected`.
        </Text>
        <Text size={1} muted>
          Row 1 shows the launch arrow and no checkmark. Row 3 shows the checkmark and no launch
          arrow. The selected state is communicated by opposite means depending on whether the row
          navigates.
        </Text>
        <Card radius={2} shadow={2} style={{maxWidth: 320}}>
          <Menu>
            {nodes.map((node) => (
              <PaneMenuButtonItem key={node.key} isAfterGroup={false} node={node} />
            ))}
          </Menu>
        </Card>
      </Stack>
    )
  },
}

/**
 * `hideSelectionIndicator` suppresses the checkmark on a selected item. It is read identically by
 * both renderers (`node.selected && !node.hideSelectionIndicator`), so this is the one selection
 * behaviour the two agree on. `pressed` still reflects selection, which is what a screen reader
 * announces, so the row is still selected; it just does not say so visually.
 */
export const SelectionIndicatorHidden: Story = {
  render: () => (
    <MenuStage note="Both rows are `selected`. The second sets `hideSelectionIndicator`, so it looks unselected while still being announced as pressed.">
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={item({key: 'shown', title: 'Sort by title', selected: true})}
      />
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={item({
          key: 'hidden',
          title: 'Sort by date',
          selected: true,
          hideSelectionIndicator: true,
        })}
      />
    </MenuStage>
  ),
}

/**
 * Recursion two levels deep, mixing every branch: a divider, an expanded group containing a
 * collapsed group, and the `isAfterGroup` divider a group's successor earns.
 */
export const NestedMenu: Story = {
  render: () => (
    <MenuStage note="A group inside a group. `isAfterGroup` is computed per child, so the divider before `Delete` comes from the group that precedes it, not from `Delete` itself.">
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={group({
          key: 'outer',
          title: 'Document',
          expanded: true,
          children: [
            item({key: 'edit', title: 'Edit', icon: EditIcon}),
            group({
              key: 'inner',
              title: 'Lifecycle',
              icon: PublishIcon,
              expanded: false,
              children: [
                item({key: 'publish', title: 'Publish', icon: PublishIcon}),
                item({key: 'unpublish', title: 'Unpublish', icon: UnpublishIcon}),
              ],
            }),
            item({key: 'delete', title: 'Delete', icon: TrashIcon, tone: 'critical'}),
          ],
        })}
      />
    </MenuStage>
  ),
}

/** All five returns in one frame, for the contact sheet. */
export const AllBranches: Story = {
  render: () => (
    <MenuStage note="Every return the component has: item, divider, empty group (invisible), expanded group, collapsed group.">
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={item({key: 'edit', title: 'Edit', icon: EditIcon})}
      />
      <PaneMenuButtonItem isAfterGroup={false} node={{type: 'divider', key: 'd'}} />
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={group({key: 'gone', title: 'Empty', children: []})}
      />
      <PaneMenuButtonItem
        isAfterGroup={false}
        node={group({
          key: 'expanded',
          title: 'Expanded',
          expanded: true,
          children: [item({key: 'p', title: 'Publish', icon: PublishIcon})],
        })}
      />
      <PaneMenuButtonItem
        isAfterGroup
        node={group({
          key: 'collapsed',
          title: 'Collapsed',
          icon: EyeOpenIcon,
          expanded: false,
          children: [item({key: 'v', title: 'View', icon: EyeOpenIcon})],
        })}
      />
    </MenuStage>
  ),
}
