import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

// Real component from its real path (org contract §8). TooltipOfDisabled wraps its
// children in a plain `<div>` so a *disabled* control still emits hover events (disabled
// buttons fire none), then shows a Tooltip. Its `disabled` prop disables the *tooltip*,
// so the idiom is `disabled={!controlIsDisabled}` — tooltip on only while the control is
// off. Renders through the ui-components Tooltip; only the global theme decorator needed.
import {TooltipOfDisabled} from '../../../../packages/sanity/src/core/components/TooltipOfDisabled'

const meta: Meta<typeof TooltipOfDisabled> = {
  title: 'Overlays & Navigation/Tooltip/Of Disabled',
  component: TooltipOfDisabled,
  parameters: {
    docs: {
      description: {
        component: [
          'A disabled button dispatches no pointer events, so a Tooltip placed directly on it never ' +
            'fires and a disabled control has no way to explain why it cannot be used. This wrapper ' +
            'fixes that for a mouse, and stops there.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/TooltipOfDisabled.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | CHROME. A single-purpose wrapper solving one DOM quirk: wrapping the disabled control in a `<div>` gives the Tooltip a live hover target |',
          '| Audit | 🔴 needs-work (`accessible-labeling`). It fixes the hover case but not the accessibility case: no `aria-label` / `aria-describedby` is set on the control, so keyboard and screen-reader users reach a disabled button with no announced reason. Same class of gap the audit logged against Studio’s icon-only controls, and the same one `ContextMenuButton` carries |',
          '| Patterns | `accessible-labeling` · `error-messages` |',
          '',
          'Note the inverted `disabled` semantics: it disables the *tooltip*, not the control, so the ' +
            'stories model the real idiom `disabled={!controlIsDisabled}`. The Recommended pair keeps ' +
            'the hover tooltip but also wires `aria-describedby` to a visually hidden reason node, so ' +
            'the explanation is programmatic, not pixels-only.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:forms',
    'chapter:actions',
    'pattern:accessible-labeling',
    'pattern:error-messages',
    'audit:needs-work',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof TooltipOfDisabled>

/** A disabled button that explains itself on hover, the component's whole reason to exist. */
export const Default: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <TooltipOfDisabled content="You do not have permission to publish" placement="top">
      <Button text="Publish" tone="primary" disabled />
    </TooltipOfDisabled>
  ),
}

/**
 * The real idiom: `disabled={!controlIsDisabled}`. Toggle the control — while it is
 * disabled the reason tooltip is live; once enabled, the tooltip switches off (there is
 * nothing to explain).
 */
function TrackingControlStateHarness() {
  const [controlDisabled, setControlDisabled] = useState(true)
  return (
    <Stack gap={4}>
      <Flex gap={3} align="center">
        <TooltipOfDisabled
          content="You do not have permission to publish"
          disabled={!controlDisabled}
          placement="top"
        >
          <Button text="Publish" tone="primary" disabled={controlDisabled} />
        </TooltipOfDisabled>
        <Button
          mode="bleed"
          text={controlDisabled ? 'Grant permission' : 'Revoke permission'}
          onClick={() => setControlDisabled((prev) => !prev)}
        />
      </Flex>
      <Text size={0} muted>
        Tooltip is live only while the button is disabled.
      </Text>
    </Stack>
  )
}

export const TrackingControlState: Story = {
  name: 'Tracking control state',
  parameters: {controls: {include: []}},
  render: () => <TrackingControlStateHarness />,
}

/**
 * Current, the audit finding: `accessible-labeling`. The reason exists, but only on
 * hover and only visually. The disabled button below carries no `aria-describedby`, no
 * `aria-label` beyond its text: a screen-reader user hears "Publish, dimmed" and never
 * learns why. Inspect the button: nothing links it to the reason.
 */
export const Current: Story = {
  name: 'accessible-labeling · Current (hover-only reason)',
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={2} shadow={1}>
      <TooltipOfDisabled content="You do not have permission to publish" placement="top">
        <Button text="Publish" tone="primary" disabled />
      </TooltipOfDisabled>
    </Card>
  ),
}

/**
 * Recommended: keep the hover tooltip, but also give the control a programmatic
 * reason. A visually hidden node holds the text and the button points at it with
 * `aria-describedby`. Now the reason is announced to assistive tech and available to
 * keyboard users, not just to a mouse hover. The wiring is added at the call site; the
 * hover behaviour is still the real `TooltipOfDisabled`.
 */
export const Recommended: Story = {
  name: 'accessible-labeling · Recommended (programmatic reason)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {controls: {include: []}},
  render: () => {
    const reasonId = 'publish-disabled-reason'
    return (
      <Card padding={4} radius={2} shadow={1}>
        <Box>
          <TooltipOfDisabled content="You do not have permission to publish" placement="top">
            <Button text="Publish" tone="primary" disabled aria-describedby={reasonId} />
          </TooltipOfDisabled>
          {/* Visually hidden, but reachable by assistive tech via aria-describedby. */}
          <span
            id={reasonId}
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clipPath: 'inset(50%)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            You do not have permission to publish
          </span>
        </Box>
      </Card>
    )
  },
}
