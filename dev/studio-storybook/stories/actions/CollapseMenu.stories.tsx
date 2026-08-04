import {BoltIcon} from '@sanity/icons/Bolt'
import {CopyIcon} from '@sanity/icons/Copy'
import {EditIcon} from '@sanity/icons/Edit'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {PublishIcon} from '@sanity/icons/Publish'
import {StarIcon} from '@sanity/icons/Star'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

// Real components from real paths (org contract §8): the responsive action bar and its
// button. CollapseMenu measures available width with an IntersectionObserver and spills
// whatever no longer fits into an overflow "…" menu (ContextMenuButton by default).
import {CollapseMenu} from '../../../../packages/sanity/src/core/components/collapseMenu/CollapseMenu'
import {CollapseMenuButton} from '../../../../packages/sanity/src/core/components/collapseMenu/CollapseMenuButton'
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'

// The action set every story shares: five toolbar actions, Delete isolated by a divider.
// Each carries an explicit `aria-label` matching its text: `CollapseMenuButton` strips the
// visible `text` when it collapses to icon-only (CollapseMenu clones it with `text: undefined`),
// so without the label the collapsed icon buttons ship with no accessible name. The label
// flows through `CollapseMenuButton`'s HTML-attr passthrough onto the underlying `<button>` and
// survives the collapse, keeping every state named. Labels equal the visible text (WCAG 2.5.3).
function toolbarActions() {
  return [
    <CollapseMenuButton key="edit" aria-label="Edit" icon={EditIcon} mode="bleed" text="Edit" />,
    <CollapseMenuButton
      key="publish"
      aria-label="Publish"
      icon={PublishIcon}
      mode="bleed"
      text="Publish"
    />,
    <CollapseMenuButton
      key="duplicate"
      aria-label="Duplicate"
      icon={CopyIcon}
      mode="bleed"
      text="Duplicate"
    />,
    <CollapseMenuButton
      key="unpublish"
      aria-label="Unpublish"
      icon={UnpublishIcon}
      mode="bleed"
      text="Unpublish"
    />,
    <CollapseMenuButton
      key="favorite"
      aria-label="Add to favorites"
      icon={StarIcon}
      mode="bleed"
      text="Add to favorites"
    />,
    <CollapseMenuButton
      key="delete"
      aria-label="Delete"
      dividerBefore
      icon={TrashIcon}
      mode="bleed"
      text="Delete"
      tone="critical"
    />,
  ]
}

const meta: Meta<typeof CollapseMenu> = {
  title: 'Actions & Commands/CollapseMenu',
  component: CollapseMenu,
  args: {gap: 1, collapsed: false},
  argTypes: {
    gap: {control: {type: 'range', min: 0, max: 4, step: 1}},
    collapsed: {control: 'boolean'},
  },
  parameters: {
    // The overflow menu portals to document.body; keep the default padded Card frame.
    docs: {
      description: {
        component: [
          'CollapseMenu keeps a Studio toolbar usable as its pane narrows: it watches how much ' +
            'room is left and sheds the least important controls into an overflow menu rather ' +
            'than letting anything wrap, clip, or push the document title off its own header.',
          '',
          '|           |                                                                                                                                                                                                                     |',
          '| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source    | `packages/sanity/src/core/components/collapseMenu/CollapseMenu.tsx`, Studio-only (no design-system equivalent)                                                                                                      |',
          '| Tier      | SERVICE. A reusable responsive-layout capability rather than a single feature: it renders a row of actions, watches which of them still fit, collapses them to icon-only, then spills the remainder into a "…" menu |',
          '| Mechanism | `IntersectionObserver` driving three render phases: expanded, collapsed, overflow                                                                                                                                   |',
          '| Audit     | ⚪ not-audited as a unit. Adjacent to ch4 `collapsible-panels` and the mobile `filmstrip` / `touch-tools` findings; the natural home for the mobile fix rather than a defect itself                                 |',
          '| Patterns  | `action-panel` · `collapsible-panels`                                                                                                                                                                               |',
          '',
          'Document headers and pane headers mount it for exactly that reason: hand it a row of ' +
            'actions and it takes over deciding what fits.',
          '',
          'Collapse is driven by real width measurement, not a breakpoint, so the `Responsive` ' +
            'story exposes a width slider and you can watch the bar shed actions live. An action ' +
            'that has overflowed keeps its icon, label, tone and divider when it reappears as a ' +
            'menu item. The same set reads the same at any width.',
          '',
          '> **Why it matters:** the default overflow trigger is a bare `ContextMenuButton`, ' +
            'whose public API cannot carry an accessible name (its tooltip is hover-visual only). ' +
            'So the moment any action can collapse into the "…" menu, the control holding the ' +
            'rest of your toolbar goes unnamed. Pass your own named trigger via ' +
            '`menuButtonProps.button`, as the `Collapsed` story does.',
          '',
          'The last story shows it in context: the "Anna Karenina" document header toolbar ' +
            'shedding its actions into a named overflow as the pane narrows.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'chapter:actions',
    'chapter:layout',
    'pattern:action-panel',
    'pattern:collapsible-panels',
    'audit:not-audited',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof CollapseMenu>

/** A wide container: every action fits, nothing collapses. Try `collapsed` in the controls. */
export const Default: Story = {
  render: (props) => (
    <Card border padding={1} radius={2} style={{width: 560}}>
      <CollapseMenu collapsed={props.collapsed} gap={props.gap}>
        {toolbarActions()}
      </CollapseMenu>
    </Card>
  ),
}

/**
 * Resize-driven collapse. Drag the slider to narrow the container: actions first drop
 * their labels and go icon-only, then spill oldest-last into the overflow "…" menu once
 * even the icons no longer fit. This is the real `IntersectionObserver` doing the work.
 */
export const Responsive: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    function Demo() {
      const [width, setWidth] = useState(360)
      return (
        <Stack gap={4}>
          <Stack gap={2} style={{maxWidth: 560}}>
            <Flex justify="space-between">
              <Text size={1} muted>
                Container width
              </Text>
              <Text size={1}>{width}px</Text>
            </Flex>
            <input
              aria-label="Container width"
              max={560}
              min={90}
              onChange={(event) => setWidth(Number(event.currentTarget.value))}
              step={10}
              style={{width: '100%'}}
              type="range"
              value={width}
            />
          </Stack>
          <Card border padding={1} radius={2} style={{width}}>
            <CollapseMenu gap={1}>{toolbarActions()}</CollapseMenu>
          </Card>
          <Box>
            <Text size={0} muted>
              Try 500px (all visible), 260px (labels drop), 120px (most in the "…" menu).
            </Text>
          </Box>
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * `collapsed` forces the fully-collapsed state: the bar delegates straight to the overflow
 * menu, so every action lives behind the "…" trigger regardless of available width.
 *
 * The default overflow trigger is a bare `ContextMenuButton`, whose public API cannot carry
 * an accessible name (its shared tooltip is hover-visual only and its props do not expose
 * `aria-label`; see the ContextMenuButton page and upstream ledger B#4). `CollapseMenu`'s own
 * API provides the fix: `menuButtonProps.button` accepts a custom trigger, so this story
 * supplies a named ellipsis `Button`, the same "…" glyph now announced as "Show more".
 */
export const Collapsed: Story = {
  // The whole point is the overflow menu behind the "..." trigger, which opens into a
  // body-level portal. Own iframe (inline: false) so the open menu is bounded and visible
  // in the docs canvas instead of overflowing the next story.
  parameters: {controls: {include: []}, docs: {story: {inline: false, height: '340px'}}},
  render: () => (
    <Card border padding={1} radius={2} style={{width: 560}}>
      <CollapseMenu
        collapsed
        gap={1}
        menuButtonProps={{
          button: (
            <Button
              aria-label="Show more"
              icon={EllipsisHorizontalIcon}
              mode="bleed"
              tooltipProps={{content: 'Show more'}}
            />
          ),
        }}
      >
        {toolbarActions()}
      </CollapseMenu>
    </Card>
  ),
}

/**
 * A custom overflow trigger via `menuButtonProps.button`: the default `ContextMenuButton`
 * ("…") is replaced with a labelled button. Narrow so the overflow menu is present.
 */
export const CustomMenuButton: Story = {
  name: 'Custom overflow trigger',
  // Own iframe so the overflow menu opened from the custom "More" trigger stays bounded in
  // the canvas (its portal renders at body level and would otherwise escape).
  parameters: {controls: {include: []}, docs: {story: {inline: false, height: '340px'}}},
  render: () => (
    <Card border padding={1} radius={2} style={{width: 180}}>
      <CollapseMenu
        gap={1}
        menuButtonProps={{button: <Button icon={BoltIcon} mode="ghost" text="More" />}}
      >
        {toolbarActions()}
      </CollapseMenu>
    </Card>
  ),
}

/**
 * In context: the document header toolbar for the "Anna Karenina" book, in a pane too
 * narrow to hold every action at full width. CollapseMenu has dropped the labels to icons
 * and spilled the overflow behind a named "Show more" trigger; open it to reach Unpublish,
 * Add to favorites and Delete. This is the real editor moment, a header toolbar that never
 * breaks whatever the pane width.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}, docs: {story: {inline: false, height: '340px'}}},
  render: () => (
    <Card border padding={2} radius={2} style={{width: 340}}>
      <Flex align="center" gap={3}>
        <Box flex={1} style={{minWidth: 0}}>
          <Stack gap={2}>
            <Text size={0} muted>
              Book · Draft
            </Text>
            <Text size={1} weight="semibold" textOverflow="ellipsis">
              Anna Karenina
            </Text>
          </Stack>
        </Box>
        {/* CollapseMenu's hidden measurement rows report a wide hypothetical size to the
        browser's flex layout (they only collapse height, not width), which would otherwise
        pull disproportionate shrinkage onto the title `Box` above and let its subtitle bleed
        under the toolbar. `flexShrink: 0` reserves the toolbar's own space instead, matching
        the real document status bar (`DocumentStatusBar.tsx`'s `actionsBoxRef` wrapper). */}
        <Flex style={{flexShrink: 0}}>
          <CollapseMenu
            gap={1}
            menuButtonProps={{
              button: (
                <Button
                  aria-label="Show more"
                  icon={EllipsisHorizontalIcon}
                  mode="bleed"
                  tooltipProps={{content: 'Show more'}}
                />
              ),
            }}
          >
            {toolbarActions()}
          </CollapseMenu>
        </Flex>
      </Flex>
    </Card>
  ),
}
