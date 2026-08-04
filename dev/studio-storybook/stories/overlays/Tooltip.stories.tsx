import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {SearchIcon} from '@sanity/icons/Search'
import {
  Box,
  Button as UIButton,
  Card,
  Flex,
  Stack,
  Text,
  TextInput,
  Tooltip as UITooltip,
} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// See stories/studio/Button.stories.tsx for why the ui-components barrel is
// imported from source rather than through the `sanity` exports map.
import {Tooltip} from '../../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {OverlayFrame} from './OverlayFrame'

const meta: Meta<typeof Tooltip> = {
  title: 'Overlays & Navigation/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component: [
          'A tooltip is a supplement, never the only home for information a person must act on, ' +
            'and this page exists because Studio does not always honor that. The shadow itself is ' +
            'a careful, standardized wrapper; the audit finding is in what gets asked of it.',
          '',
          '|          |                                                                                                                                                                                                                              |',
          '| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/ui-components/tooltip/Tooltip.tsx`, Studio shadow of `@sanity/ui` `Tooltip`                                                                                                                             |',
          '| Tier     | SERVICE. Fixes padding/arrow/shadow, standardizes the open delay, portals, and adds hotkey rendering                                                                                                                         |',
          '| Audit    | 🔴 needs-work (`error-messages`, `accessible-labeling`). Studio hides real error text behind a hover-only icon tooltip, and ships six or more icon-only controls with no accessible name. Its intended `datatips` role holds |',
          '| Patterns | `datatips` · `error-messages` · `accessible-labeling`                                                                                                                                                                        |',
          '',
          'The shadow removes the `arrow` / `padding` / `shadow` props and applies shared ' +
            'defaults: `animate`, a 400ms open delay (`TOOLTIP_DELAY_PROPS`), ' +
            '`placement="bottom"` with corner fallbacks, and `portal`. A `string` `content` is ' +
            'wrapped in `Text size={1}`; a `hotkeys` array renders inline. The source itself ' +
            'notes: strongly prefer a short `string` `content` for i18n.',
          '',
          'Current puts the validation message where only a hover reveals it; Recommended shows ' +
            'the message inline and lets the tooltip add detail. The accessible-labeling pair ' +
            'contrasts a bare icon button with one that carries both a tooltip and an ' +
            '`aria-label`.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:data',
    'chapter:forms',
    'pattern:datatips',
    'pattern:error-messages',
    'pattern:accessible-labeling',
    'audit:needs-work',
    'source:studio-shadow',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof Tooltip>

/**
 * The raw `@sanity/ui` primitive. You own padding/arrow/shadow and must compose
 * the content node yourself. Hover the button to reveal it.
 */
export const Primitive: Story = {
  render: () => (
    <OverlayFrame minHeight={160}>
      <UITooltip
        content={
          <Box padding={2}>
            <Text size={1}>Primitive tooltip</Text>
          </Box>
        }
        portal
      >
        <UIButton text="Hover me" />
      </UITooltip>
    </OverlayFrame>
  ),
}

/**
 * The Studio shadow with a `string` `content`, wrapped in `Text size={1}` and
 * padded for you. Hover to reveal (400ms open delay).
 */
export const Default: Story = {
  render: () => (
    <OverlayFrame minHeight={160}>
      <Tooltip content="Publish this document" portal>
        <UIButton text="Hover me" tone="primary" />
      </Tooltip>
    </OverlayFrame>
  ),
}

/**
 * `hotkeys` renders a keyboard hint inline beside the label, the pattern used
 * across Studio action buttons.
 */
export const WithHotkeys: Story = {
  render: () => (
    <OverlayFrame minHeight={160}>
      <Tooltip content="Search" hotkeys={['Ctrl', 'K']} portal>
        <UIButton icon={SearchIcon} mode="ghost" text="Search" />
      </Tooltip>
    </OverlayFrame>
  ),
}

/**
 * Current, the audit finding: `error-messages`. Studio signals an invalid field
 * with a red icon and pink fill only, the actual message (for example "Dude,
 * UPPERCASE!") is hidden until you hover the icon. The information needed to fix
 * the error is not visible at rest.
 */
export const Current: Story = {
  name: 'Current (message behind hover)',
  tags: ['audit:needs-work'],
  render: () => (
    <OverlayFrame minHeight={160}>
      <Stack gap={3} style={{maxWidth: 320}}>
        <Text size={1} weight="medium">
          Slug
        </Text>
        <Flex gap={2} align="center">
          <Box flex={1}>
            <TextInput value="MY-SLUG" customValidity=" " />
          </Box>
          <Tooltip content="Dude, UPPERCASE! Slugs must be lowercase." portal>
            <Text size={2}>
              <ErrorOutlineIcon style={{color: 'var(--card-badge-critical-fg-color)'}} />
            </Text>
          </Tooltip>
        </Flex>
      </Stack>
    </OverlayFrame>
  ),
}

/**
 * Recommended: the validation message is shown inline, at rest, in a critical
 * tone. The tooltip is demoted to an optional supplement, extra detail on
 * hover. Nothing the editor must act on is hidden.
 */
export const Recommended: Story = {
  name: 'Recommended (message inline)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => {
    // Complete the a11y wiring the story claims: the label is a real `<label>`
    // bound to the input via `htmlFor`/`id`, and the inline error is linked with
    // `aria-describedby` so assistive tech announces the reason on focus — not just
    // for sighted users. Clears the "form field should have an id or name" flag.
    const inputId = 'slug-input-recommended'
    const errorId = 'slug-error-recommended'
    return (
      <OverlayFrame minHeight={180}>
        <Stack gap={3} style={{maxWidth: 320}}>
          <Text as="label" htmlFor={inputId} size={1} weight="medium">
            Slug
          </Text>
          <TextInput
            id={inputId}
            value="MY-SLUG"
            customValidity=" "
            aria-invalid="true"
            aria-describedby={errorId}
          />
          <Card id={errorId} tone="critical" padding={2} radius={2}>
            <Flex gap={2} align="center">
              <Text size={1}>
                <ErrorOutlineIcon />
              </Text>
              <Text size={1}>Slugs must be lowercase, try “my-slug”.</Text>
            </Flex>
          </Card>
        </Stack>
      </OverlayFrame>
    )
  },
}

/**
 * Current, the audit finding: `accessible-labeling`. An icon-only button with no
 * tooltip and no `aria-label`, screen readers announce nothing actionable, and
 * sighted users get no name on hover.
 */
export const AccessibleLabelingBad: Story = {
  name: 'Accessible labeling · bad',
  tags: ['audit:needs-work'],
  render: () => (
    <OverlayFrame minHeight={140}>
      <UIButton icon={SearchIcon} mode="bleed" />
    </OverlayFrame>
  ),
}

/**
 * Recommended: the same icon-only button, now named both ways: a Studio
 * `Tooltip` for sighted users and an `aria-label` for assistive tech.
 */
export const AccessibleLabelingGood: Story = {
  name: 'Accessible labeling · good',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => (
    <OverlayFrame minHeight={140}>
      <Tooltip content="Search" portal>
        <UIButton icon={SearchIcon} mode="bleed" aria-label="Search" />
      </Tooltip>
    </OverlayFrame>
  ),
}
