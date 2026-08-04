import {CopyIcon} from '@sanity/icons/Copy'
import {EditIcon} from '@sanity/icons/Edit'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {Card, Flex, Menu, MenuDivider, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real components from real paths (org contract §8). ContextMenuButton is the
// Studio-standard "…" trigger; MenuButton/MenuItem are the ui-components shadows it
// is normally the `button` of. `useTranslation` inside ContextMenuButton resolves
// through the global i18next decorator (no studio provider stack needed).
import {ContextMenuButton} from '../../../../packages/sanity/src/core/components/contextMenuButton/ContextMenuButton'
import {MenuButton} from '../../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'

const meta: Meta<typeof ContextMenuButton> = {
  title: 'Actions & Commands/ContextMenuButton',
  component: ContextMenuButton,
  args: {mode: 'bleed'},
  argTypes: {
    mode: {control: 'radio', options: ['bleed', 'ghost', 'default']},
    tone: {control: 'radio', options: ['default', 'primary', 'positive', 'caution', 'critical']},
    size: {control: 'radio', options: ['default', 'large']},
    selected: {control: 'boolean'},
    loading: {control: 'boolean'},
    disabled: {control: 'boolean'},
  },
  parameters: {
    docs: {
      description: {
        component: [
          "ContextMenuButton is Studio's one more-actions affordance: the ellipsis at the end " +
            'of a row or header that opens a menu of what can be done there. Because the glyph ' +
            'and the tooltip were decided once, an editor learns the mark in one place and ' +
            'recognises it everywhere else.',
          '',
          '|          |                                                                                                                                                                                                                     |',
          '| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/core/components/contextMenuButton/ContextMenuButton.tsx`, Studio-only (no design-system equivalent)                                                                                            |',
          '| Tier     | CHROME. A thin, single-purpose wrapper over the ui-components `Button`: it pins the horizontal-ellipsis icon and supplies one shared localized tooltip (`common.context-menu-button.tooltip`). No bespoke behaviour |',
          '| Audit    | 🔴 needs-work (`accessible-labeling`), against the finding "≥6 icon-only controls with no accessible name"                                                                                                          |',
          '| Ledger   | upstream **B#4**. The remedy is component work: derive the name from `tooltipProps.content` in the ui-components Button tooltip path, or widen this component’s props                                               |',
          '| Patterns | `action-panel` · `accessible-labeling`                                                                                                                                                                              |',
          '',
          'Normal usage is as the `button` of a `MenuButton`, which the first story shows; the ' +
            'rest sweep the props it re-exposes from `Button` (`tone`, `mode`, `size`, and the ' +
            '`selected` / `loading` / `disabled` states).',
          '',
          'What no story here can show is the trigger being _named_. `ContextMenuButton` ' +
            'forwards `tooltipProps.content` to a `Tooltip`, which sets no `aria-label`, and its ' +
            'typed props pick only `mode`, `selected`, `size`, `tone`, `tooltipProps` and ' +
            '`loading` from `Button`, plus `disabled`, `hidden` and `onClick`. There is no way ' +
            'in. A caller cannot name this control without casting past the public API, so every ' +
            'button on this page is the demonstrated defect rather than a story with a fix in it, ' +
            'and none of them fakes one.',
          '',
          '> **Why it matters:** treat a bare `ContextMenuButton` as unfinished. An editor ' +
            'using a screen reader hears nothing where a sighted editor sees "more actions", and ' +
            'no care at the call site repairs it. Where a named trigger is available as an ' +
            'alternative, use it: `CollapseMenu` accepts one through `menuButtonProps.button`, ' +
            'which is the only workaround that exists today.',
          '',
          'The last story shows it in context: the "…" overflow on an author row (Leo Tolstoy) ' +
            'opening the document-actions menu, where the trigger actually lives, one per row.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'chapter:actions',
    'pattern:action-panel',
    'pattern:accessible-labeling',
    'audit:needs-work',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof ContextMenuButton>

const documentMenu = (
  <Menu>
    <MenuItem text="Edit" icon={EditIcon} />
    <MenuItem text="Duplicate" icon={CopyIcon} />
    <MenuItem text="Publish" icon={PublishIcon} />
    <MenuDivider />
    <MenuItem text="Delete" icon={TrashIcon} tone="critical" />
  </Menu>
)

/**
 * **Current (audit finding).** `accessible-labeling`: the standard "…" trigger opening a
 * document overflow menu, and the demonstrated defect. The rendered trigger has **no
 * programmatic accessible name**: the shared tooltip is hover-visual only, and the public
 * props do not expose `aria-label`, so the button reaches assistive tech unnamed and cannot
 * be named without casting past the API. This story *is* the evidence for ledger B#4; the
 * remedy is component work (see the page Audit note), not a story-level fix. The menu it opens
 * is correctly labelled. The gap is the trigger alone.
 */
export const Default: Story = {
  name: 'Current (unnamed "…" trigger)',
  tags: ['audit:needs-work'],
  parameters: {controls: {include: []}},
  render: () => (
    <MenuButton
      id="context-menu-default"
      button={<ContextMenuButton />}
      menu={documentMenu}
      popover={{portal: true}}
    />
  ),
}

/**
 * The trigger on its own, no menu wired, showing the default bleed styling. This is the
 * story the page's controls drive: every prop the component re-exposes is on the panel,
 * which also makes the absent one (`aria-label`) legible as an absence.
 */
export const Standalone: Story = {
  render: (props) => <ContextMenuButton {...props} />,
}

/** The five Sanity UI button tones, all keeping the shared ellipsis and tooltip. */
export const Tones: Story = {
  parameters: {
    controls: {include: []},
    docs: {description: {story: 'The button tone maps straight through to `Button`/`@sanity/ui`.'}},
  },
  render: () => (
    <Flex gap={3} align="center">
      {(['default', 'primary', 'positive', 'caution', 'critical'] as const).map((tone) => (
        <Stack key={tone} gap={3}>
          <ContextMenuButton tone={tone} />
          <Text align="center" size={0} muted>
            {tone}
          </Text>
        </Stack>
      ))}
    </Flex>
  ),
}

/** The three modes, `bleed` (default), `ghost` and `default`, each at both sizes. */
export const ModesAndSizes: Story = {
  name: 'Modes and sizes',
  parameters: {controls: {include: []}},
  render: () => (
    <Stack gap={4}>
      {(['default', 'large'] as const).map((size) => (
        <Flex key={size} gap={3} align="center">
          <Text size={0} muted style={{width: 48}}>
            {size}
          </Text>
          {(['bleed', 'ghost', 'default'] as const).map((mode) => (
            <Stack key={mode} gap={3}>
              <ContextMenuButton mode={mode} size={size} />
              <Text align="center" size={0} muted>
                {mode}
              </Text>
            </Stack>
          ))}
        </Flex>
      ))}
    </Stack>
  ),
}

/** The four states: resting, `selected` (the menu-open look), `loading`, and `disabled`. */
export const States: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={4} align="center">
      {(
        [
          {label: 'resting', props: {}},
          {label: 'selected', props: {selected: true}},
          {label: 'loading', props: {loading: true}},
          {label: 'disabled', props: {disabled: true}},
        ] as const
      ).map(({label, props}) => (
        <Stack key={label} gap={3}>
          <Card padding={1} radius={2} border>
            <ContextMenuButton {...props} />
          </Card>
          <Text align="center" size={0} muted>
            {label}
          </Text>
        </Stack>
      ))}
    </Flex>
  ),
}

/**
 * In context: a document list row (the author "Leo Tolstoy") with the standard "…" overflow
 * at its trailing edge. Open it and you get the same `documentMenu` as the first story: Edit,
 * Duplicate, Publish, Delete. This is where the trigger really lives, one per row, and the row
 * makes the audit's point concrete. The menu it opens is correctly named; the "…" that summons
 * it still reaches assistive tech unnamed.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={2} radius={2} shadow={1} style={{maxWidth: 360}}>
      <Flex align="center" gap={3} paddingLeft={2}>
        <Stack gap={2} flex={1}>
          <Text size={1} weight="medium" textOverflow="ellipsis">
            Leo Tolstoy
          </Text>
          <Text size={0} muted>
            Author
          </Text>
        </Stack>
        <MenuButton
          id="context-menu-in-context"
          button={<ContextMenuButton />}
          menu={documentMenu}
          popover={{portal: true}}
        />
      </Flex>
    </Card>
  ),
}
