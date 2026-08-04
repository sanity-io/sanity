import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CopyIcon} from '@sanity/icons/Copy'
import {EditIcon} from '@sanity/icons/Edit'
import {ImageIcon} from '@sanity/icons/Image'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Box, Card, LayerProvider, Menu, Stack, Text} from '@sanity/ui'
import {type Decorator, type Meta, type StoryObj} from '@storybook/react-vite'

// Studio shadow (barrel). MenuItem restricts `children` to keep items single-line and
// adds tooltip + badge + subtitle + preview affordances over the @sanity/ui MenuItem.
// The items render inside a bare @sanity/ui `Menu` container (no popover), so the docs
// page shows every variant expanded without a click.
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'

const TONES = ['default', 'primary', 'positive', 'caution', 'critical'] as const

// A 25x25 preview node (the component clamps previews to that box).
function Swatch({color}: {color: string}) {
  return <div style={{width: 25, height: 25, borderRadius: 3, background: color}} />
}

// `@sanity/ui`'s `Menu` calls `useLayer()` internally, which throws
// "useLayer(): missing context value" without a `LayerProvider` ancestor. Provide
// one at the file level so every MenuItem story (each of which mounts its own bare
// `Menu`) renders. Mirrors how @sanity/ui's own MenuItem stories mount.
const withLayer: Decorator = (Story) => (
  <LayerProvider>
    <Story />
  </LayerProvider>
)

const meta: Meta<typeof MenuItem> = {
  title: 'Actions & Commands/MenuItem',
  component: MenuItem,
  decorators: [withLayer],
  args: {text: 'Edit'},
  argTypes: {
    text: {control: 'text'},
    badgeText: {control: 'text'},
    tone: {control: 'radio', options: TONES},
    selected: {control: 'boolean'},
    pressed: {control: 'boolean'},
    disabled: {control: 'boolean'},
  },
  parameters: {
    docs: {
      description: {
        component: [
          'MenuItem is the one row every menu in Studio is built from. It restricts more than ' +
            'the primitive underneath it: the set of affordances is fixed rather than open, so ' +
            'menus written years apart by people who never met still line up down the page.',
          '',
          '|             |                                                                                                                                                                          |',
          '| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |',
          '| Source      | `packages/sanity/src/ui-components/menuItem/MenuItem.tsx`, the Studio shadow of `@sanity/ui` MenuItem                                                                    |',
          '| Tier        | CHROME. A menu row is commodity. The shadow blocks `children`, which is what keeps rows single-line and legible                                                          |',
          '| Affordances | leading icon, trailing icon, hotkey hint, badge, subtitle, and a 25×25 preview slot. That list is the whole permitted set                                                |',
          '| Audit       | ⚪ not-audited as a unit. It is the row primitive the `MenuButton` illustrations compose; `tone` and `selected` are where `similarity` can be answered at the item level |',
          '| Patterns    | `smart-menu-items` · `similarity`                                                                                                                                        |',
          '',
          'Give it text and it is a plain action; add an icon, a hotkey, a badge or a preview ' +
            'and it grows to fit without anyone laying anything out.',
          '',
          'Each story renders its rows inside a bare `@sanity/ui` `Menu`, so every state is ' +
            'visible without opening a popover first.',
          '',
          '> **Why it matters:** the block on arbitrary `children` is the feature, not a ' +
            'limitation to work around. If you find yourself trying to fit a multi-line layout ' +
            'into a menu item, the component is telling you something: that uniform row is what ' +
            'makes a menu scannable, and a menu that gives it up stops being one.',
          '',
          'The last story shows it in context: a document-actions menu for the "Anna Karenina" ' +
            'book, assembled row by row from MenuItems.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'chapter:actions',
    'pattern:smart-menu-items',
    'pattern:similarity',
    'audit:not-audited',
    'source:studio-shadow',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof MenuItem>

/** One row, wired to the controls: change its text, tone, badge and states in place. */
export const Default: Story = {
  render: (props) => (
    <Menu>
      <MenuItem {...props} icon={EditIcon} />
    </Menu>
  ),
}

/** The full affordance set: leading icon, trailing icon, hotkey hint, badge, subtitle, preview. */
export const Variants: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Menu>
      <MenuItem text="Plain" />
      <MenuItem text="Leading icon" icon={EditIcon} />
      <MenuItem text="Trailing icon" icon={PublishIcon} iconRight={CheckmarkIcon} />
      <MenuItem text="With hotkey" icon={PublishIcon} hotkeys={['Ctrl', 'Alt', 'P']} />
      <MenuItem text="With badge" icon={CopyIcon} badgeText="New" />
      <MenuItem
        text="With subtitle"
        icon={ImageIcon}
        __unstable_subtitle="Escape hatch, workspace menu only"
      />
      <MenuItem text="With preview" preview={<Swatch color="#f03e3e" />} />
    </Menu>
  ),
}

/** The row carries the same tonal palette as buttons. */
export const Tones: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Menu>
      {TONES.map((tone) => (
        <MenuItem key={tone} text={tone} icon={PublishIcon} tone={tone} />
      ))}
    </Menu>
  ),
}

/** Selected and disabled states. */
export const SelectedAndDisabled: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Menu>
      <MenuItem text="Selected" icon={CheckmarkIcon} selected />
      <MenuItem text="Pressed" icon={PublishIcon} pressed />
      <MenuItem text="Disabled" icon={UnpublishIcon} disabled />
      <MenuItem text="Disabled + critical" icon={TrashIcon} tone="critical" disabled />
    </Menu>
  ),
}

/** Tooltip on a disabled item: the shadow wraps the row so the tooltip still fires. */
export const WithTooltip: Story = {
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'A disabled item cannot receive hover events itself, so the shadow wraps it in a span ' +
          'to keep the tooltip working. That is what makes it possible to explain _why_ an ' +
          'action is unavailable, rather than leaving a dead row on the page.',
      },
    },
  },
  render: () => (
    <Menu>
      <MenuItem
        text="Unpublish"
        icon={UnpublishIcon}
        disabled
        tooltipProps={{content: 'This document is not published yet'}}
      />
    </Menu>
  ),
}

/**
 * In context: the document-actions menu for the "Anna Karenina" book, assembled row by row
 * from MenuItems. Each row carries only the affordances it needs. Publish shows its hotkey,
 * Unpublish is disabled with a tooltip that explains why, Delete is toned critical. This is
 * the atom the other menu stories compose, doing its real job.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card radius={2} shadow={1} style={{maxWidth: 320}}>
      <Stack gap={3} padding={2}>
        <Stack gap={2} padding={1}>
          <Text size={1} weight="semibold">
            Anna Karenina
          </Text>
          <Text size={0} muted>
            Book · Draft
          </Text>
        </Stack>
        <Box>
          <Menu>
            <MenuItem text="Edit" icon={EditIcon} />
            <MenuItem text="Publish" icon={PublishIcon} hotkeys={['Ctrl', 'Alt', 'P']} />
            <MenuItem text="Duplicate" icon={CopyIcon} />
            <MenuItem
              text="Unpublish"
              icon={UnpublishIcon}
              disabled
              tooltipProps={{content: 'This document is not published yet'}}
            />
            <MenuItem text="Delete" icon={TrashIcon} tone="critical" />
          </Menu>
        </Box>
      </Stack>
    </Card>
  ),
}
