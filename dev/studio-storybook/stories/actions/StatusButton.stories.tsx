import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {CircleIcon} from '@sanity/icons/Circle'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type ButtonTone, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from its real path (org contract §8). StatusButton is Studio's
// bleed-mode `Button` with a small status dot pinned top-right and a REQUIRED
// `aria-label`: the standard "this control has state" trigger in the navbar and
// document header. It renders through the ui-components `Button`, so only the global
// theme decorator is needed (no studio provider stack).
import {StatusButton} from '../../../../packages/sanity/src/core/components/StatusButton'

// The five tones StatusButton's dot colours through `--card-badge-<tone>-dot-color`.
const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']

const meta: Meta<typeof StatusButton> = {
  title: 'Actions & Commands/StatusButton',
  component: StatusButton,
  args: {
    'text': 'Publish',
    'tone': 'caution',
    'aria-label': 'Publish, document has warnings',
  },
  argTypes: {
    text: {control: 'text'},
    tone: {control: 'radio', options: TONES},
    selected: {control: 'boolean'},
    loading: {control: 'boolean'},
    disabled: {control: 'boolean'},
  },
  parameters: {
    docs: {
      description: {
        component: [
          "StatusButton is Studio's one component for a control that also carries state: when a " +
            'button needs to say more than its label, that a document has warnings, that a ' +
            'connection is live, this is what it becomes.',
          '',
          '|               |                                                                                                                                                                                                                          |',
          '| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |',
          '| Source        | `packages/sanity/src/core/components/StatusButton.tsx`, Studio-only (no design-system equivalent)                                                                                                                        |',
          '| Tier          | CHROME. A thin styled wrapper over the ui-components `Button`: forces `mode="bleed"`, absolutely positions a 4×4px status `Dot` in the top-right corner tinted by tone, and makes `aria-label` a _required_ prop         |',
          '| Audit         | 🔴 needs-work (`similarity`). The status signal is the dot, and the dot is colour only: same 4×4 circle, same position, for every tone. In grayscale, caution and critical and positive collapse into one identical mark |',
          '| Contradiction | `disabled` is typed to accept a boolean _or_ a `{reason}` object, but the component runs `Boolean(disabledProp)`. The object collapses to bare `true` and the reason never reaches the DOM                               |',
          '| Patterns      | `similarity` · `accessible-labeling`                                                                                                                                                                                     |',
          '',
          'Unlike most Studio triggers it _requires_ an `aria-label`, so a stateful control ' +
            'here can never ship without a programmatic name, which is more than the rest of the ' +
            'chapter can claim.',
          '',
          'On the tags: `working-memory` was considered and does not fit. That finding is about ' +
            'system state the interface forgets to persist or show, an applied sort for instance. ' +
            'StatusButton renders current state rather than remembered state, so this page tags ' +
            '`similarity` alone. The open `similarity` gap is that the dot carries its meaning in ' +
            'colour and nothing else; the `Current` and `Recommended` pair swaps in a per-status ' +
            'shape and shows both rows through a grayscale filter, which is where the difference ' +
            'stops being arguable.',
          '',
          '> **Why it matters:** the `disabled` prop lies. Its type invites an explanation to ' +
            'be attached and the component discards it, so an editor who lacks publish permission ' +
            'is told only that they cannot publish, never why. Until it is fixed upstream, ' +
            'explain a disabled StatusButton with a tooltip and treat the `reason` field as ' +
            'though it were not there. `DisabledReasonIsDropped` shows the two buttons being ' +
            'indistinguishable.',
          '',
          'The last story shows it in context: the status bar of the _Anna Karenina_ document, ' +
            'its publish state carried by a labelled caution dot in the header corner.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:actions',
    'chapter:lawsofux',
    'pattern:similarity',
    'pattern:accessible-labeling',
    'audit:needs-work',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof StatusButton>

/** Standard usage: a bleed button carrying a caution dot, with its required label. */
export const Default: Story = {
  render: (props) => <StatusButton {...props} />,
}

/** The tone sweep: every tone renders the same dot in a different colour, nothing else. */
export const Tones: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={4} align="center">
      {TONES.map((tone) => (
        <Stack key={tone} gap={3}>
          <StatusButton
            icon={CircleIcon}
            tone={tone}
            aria-label={`Status: ${tone}`}
            tooltipProps={null}
          />
          <Text align="center" size={0} muted>
            {tone}
          </Text>
        </Stack>
      ))}
    </Flex>
  ),
}

/** Resting, selected (the menu-open look), loading, and the plain disabled state. */
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
            <StatusButton
              icon={CircleIcon}
              tone="primary"
              aria-label={`Publish, ${label}`}
              tooltipProps={null}
              {...props}
            />
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
 * The dropped-reason contradiction, made visible. Both buttons below are disabled; the
 * right one was passed `disabled={{reason: …}}`. The component coerces that object to a
 * bare `true`, so the reason never reaches the DOM and the two are indistinguishable.
 * The type invites an explanation the component cannot deliver.
 */
export const DisabledReasonIsDropped: Story = {
  name: 'Disabled reason is dropped (contradiction)',
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={4} align="center">
      <Stack gap={3}>
        <StatusButton text="Publish" disabled aria-label="Publish, disabled" />
        <Text align="center" size={0} muted>
          disabled={'{true}'}
        </Text>
      </Stack>
      <Stack gap={3}>
        <StatusButton
          text="Publish"
          // The typed `{reason}` shape is accepted, then discarded by `Boolean(disabledProp)`.
          disabled={{reason: 'You lack publish permission'}}
          aria-label="Publish, disabled"
        />
        <Text align="center" size={0} muted>
          disabled={'{{reason}}'}, reason lost
        </Text>
      </Stack>
    </Flex>
  ),
}

/**
 * **Current (audit finding).** `similarity`: four StatusButtons, four different tones,
 * one identical dot. Below, the same row in grayscale. With hue removed the status marks
 * are literally the same pixel, and the buttons no longer tell you anything about their
 * state.
 */
function ColourOnlyRow({grayscale}: {grayscale?: boolean}) {
  return (
    <Card
      padding={3}
      radius={2}
      shadow={1}
      style={grayscale ? {filter: 'grayscale(1)'} : undefined}
    >
      <Flex gap={4} align="center">
        {(['primary', 'positive', 'caution', 'critical'] as const).map((tone) => (
          <StatusButton
            key={tone}
            icon={CircleIcon}
            tone={tone}
            aria-label={`Status ${tone}`}
            tooltipProps={null}
          />
        ))}
      </Flex>
    </Card>
  )
}

export const Current: Story = {
  name: 'similarity · Current (colour-only dot)',
  parameters: {controls: {include: []}},
  render: () => (
    <Stack gap={4}>
      <Stack gap={2}>
        <Text size={1} weight="medium">
          As shipped: the dot carries the meaning, and it is colour only
        </Text>
        <ColourOnlyRow />
      </Stack>
      <Stack gap={2}>
        <Text size={1} weight="medium" muted>
          The same four buttons in grayscale: every status now looks identical
        </Text>
        <ColourOnlyRow grayscale />
      </Stack>
    </Stack>
  ),
}

/**
 * **Recommended.** Keep the tone, but let a **shape** carry the status: swap the generic
 * dot for a glyph whose silhouette differs per state (error triangle, warning, check,
 * info). The state becomes readable before colour is perceived, and it survives grayscale.
 * This uses the real `StatusButton`; the fix is entirely in which `icon` is chosen.
 */
export const Recommended: Story = {
  name: 'similarity · Recommended (shape carries status)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {controls: {include: []}},
  render: () => {
    const rows: {tone: ButtonTone; icon: typeof ErrorOutlineIcon; label: string}[] = [
      {tone: 'critical', icon: ErrorOutlineIcon, label: 'Error'},
      {tone: 'caution', icon: WarningOutlineIcon, label: 'Warning'},
      {tone: 'positive', icon: CheckmarkCircleIcon, label: 'OK'},
      {tone: 'primary', icon: InfoOutlineIcon, label: 'Info'},
    ]
    const row = (grayscale?: boolean) => (
      <Card
        padding={3}
        radius={2}
        shadow={1}
        style={grayscale ? {filter: 'grayscale(1)'} : undefined}
      >
        <Flex gap={4} align="center">
          {rows.map(({tone, icon, label}) => (
            <StatusButton
              key={label}
              icon={icon}
              tone={tone}
              aria-label={`Status: ${label}`}
              tooltipProps={null}
            />
          ))}
        </Flex>
      </Card>
    )
    return (
      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={1} weight="medium">
            Distinct shapes per status, legible without relying on it
          </Text>
          {row()}
        </Stack>
        <Stack gap={2}>
          <Text size={1} weight="medium" muted>
            The same row in grayscale, still distinguishable
          </Text>
          {row(true)}
        </Stack>
      </Stack>
    )
  },
}

/**
 * In context: the status bar of the "Anna Karenina" document. On the right, a `StatusButton`
 * carries the live publish state, a caution dot and its *required* `aria-label` announcing
 * "2 validation warnings", so the signal reaches assistive tech even though the dot itself is
 * colour only. This is the navbar and document-header moment the component exists for.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={2} radius={2} shadow={1} style={{maxWidth: 460}}>
      <Flex align="center" gap={3} paddingLeft={2}>
        <Stack gap={2} flex={1}>
          <Text size={1} weight="medium" textOverflow="ellipsis">
            Anna Karenina
          </Text>
          <Text size={0} muted>
            Draft · edited just now
          </Text>
        </Stack>
        <StatusButton
          text="Publish"
          icon={WarningOutlineIcon}
          tone="caution"
          aria-label="Anna Karenina, 2 validation warnings"
        />
      </Flex>
    </Card>
  ),
}
