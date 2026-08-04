import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type ButtonTone, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from its real path (org contract §8). TextWithTone is the shared
// tinting primitive behind Studio's toned inline text — validation messages, filter
// labels, error strips — it maps a `tone` to a `--card-badge-<tone>-fg-color`.
import {TextWithTone} from '../../../../packages/sanity/src/core/components/textWithTone/TextWithTone'

// The tones TextWithTone styles (its CSS only defines these five; other ButtonTones
// fall through to inherited colour).
const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']

const meta: Meta<typeof TextWithTone> = {
  title: 'Document Status/Text With Tone',
  component: TextWithTone,
  args: {tone: 'critical', size: 1, children: 'Dude, UPPERCASE!'},
  argTypes: {
    tone: {control: 'select', options: TONES},
    dimmed: {control: 'boolean'},
    muted: {control: 'boolean'},
  },
  render: (props) => (
    <Card padding={3} radius={2} shadow={1} style={{maxWidth: 360}}>
      <TextWithTone {...props} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        component: [
          'Tone alone is not a signal every editor can read: the audit found validation errors ' +
            'set apart from neutral help text by hue only, invisible in grayscale and to ' +
            'colour-blind editors.',
          '',
          '|          |                                                                                                                                                                                                                                                                                                                                                                                                       |',
          '| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/core/components/textWithTone/TextWithTone.tsx`, Studio-only, no DS equivalent                                                                                                                                                                                                                                                                                                    |',
          '| Tier     | CHROME. A pure presentation primitive: it wraps `@sanity/ui` `<Text>` and swaps one CSS custom property (`--card-fg-color`) per `tone`, plus an optional `dimmed` opacity. Zero domain logic                                                                                                                                                                                                          |',
          '| Audit    | 🔴 needs-work (`similarity`, `error-messages`). TextWithTone is the mechanism behind colour-only status text. The audit found form errors rendered as a red icon + pink fill with the actual message hidden until hover; where the message is shown, it is distinguished from neutral copy by hue alone. Toned text with no shape or label cue is unreadable in grayscale and to colour-blind editors |',
          '| Patterns | `similarity` · `error-messages`                                                                                                                                                                                                                                                                                                                                                                       |',
          '',
          'The little primitive that tints a line of text by tone, the mechanism behind ' +
            "Studio's coloured validation messages, filter labels, and error strips. Any time a " +
            'line of text in Studio turns red for an error, amber for a caution, or green for ' +
            'success, this is the primitive doing it. TextWithTone wraps `@sanity/ui` `<Text>` ' +
            'and swaps a single CSS custom property per tone, no domain logic, just the colour. ' +
            'That makes it the quiet workhorse behind toned copy across the whole app, and also ' +
            'the exact spot where a colour-only-status habit takes root.',
          '',
          'Its CSS defines exactly five tones (`default`, `primary`, `positive`, `caution`, ' +
            '`critical`); any other `ButtonTone` falls through to inherited colour. `muted` ' +
            'short-circuits the tone rule entirely (`&:not([data-muted])`), and `dimmed` drops ' +
            'opacity to 0.3, both are visible in the sweeps below.',
          '',
          '> **Why it matters:** when this is used for status, pair the toned text with a ' +
            'leading icon that carries the same meaning by shape, so the message reads as an ' +
            'error before the pink is perceived.',
          '',
          'The last story shows it in context: the toned lines composed into a real validation ' +
            'summary for the book Anna Karenina.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:lawsofux',
    'chapter:forms',
    'pattern:similarity',
    'pattern:error-messages',
    'audit:needs-work',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof TextWithTone>

/** Playground; pick a tone, toggle muted/dimmed from the controls. */
export const Default: Story = {}

/** The full tone sweep: the five tones TextWithTone actually styles. */
export const ToneSweep: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={3} radius={2} shadow={1}>
      <Stack gap={3}>
        {TONES.map((tone) => (
          <Flex key={tone} gap={3} align="center">
            <TextWithTone tone={tone} size={1}>
              The quick brown fox
            </TextWithTone>
            <Text size={0} muted>
              tone=&quot;{tone}&quot;
            </Text>
          </Flex>
        ))}
      </Stack>
    </Card>
  ),
}

/** `dimmed`: 0.3 opacity, for de-emphasised toned text (e.g. inactive filters). */
export const Dimmed: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={3} radius={2} shadow={1}>
      <Flex gap={4}>
        {(['positive', 'caution', 'critical'] as const).map((tone) => (
          <Stack key={tone} gap={2} style={{textAlign: 'center'}}>
            <TextWithTone tone={tone} size={1}>
              Normal
            </TextWithTone>
            <TextWithTone tone={tone} size={1} dimmed>
              Dimmed
            </TextWithTone>
          </Stack>
        ))}
      </Flex>
    </Card>
  ),
}

/**
 * `muted`: the tone rule is suppressed (`&:not([data-muted])`), so the text falls
 * back to the muted foreground regardless of tone. Shown against the non-muted
 * equivalent so the short-circuit is visible.
 */
export const MutedVsToned: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={3} radius={2} shadow={1}>
      <Stack gap={3}>
        <Flex gap={3} align="center">
          <TextWithTone tone="critical" size={1}>
            Toned critical
          </TextWithTone>
          <Text size={0} muted>
            tone applies
          </Text>
        </Flex>
        <Flex gap={3} align="center">
          <TextWithTone tone="critical" size={1} muted>
            Muted critical
          </TextWithTone>
          <Text size={0} muted>
            tone suppressed by `muted`
          </Text>
        </Flex>
      </Stack>
    </Card>
  ),
}

/**
 * **Current (audit finding).** `similarity` / `error-messages`: a validation message
 * carried by tone alone, the real `TextWithTone` in `critical`. Beside it, the same
 * strip in grayscale: with the pink gone, the error is indistinguishable from an
 * ordinary line of help text.
 */
export const Current: Story = {
  name: 'similarity, Current (tone-only message)',
  parameters: {controls: {include: []}},
  render: () => (
    <Stack gap={4}>
      <Stack gap={2}>
        <Text size={1} weight="medium">
          As shipped, colour is the only signal
        </Text>
        <Card padding={3} radius={2} shadow={1}>
          <TextWithTone tone="critical" size={1}>
            Dude, UPPERCASE!
          </TextWithTone>
        </Card>
      </Stack>
      <Stack gap={2}>
        <Text size={1} weight="medium" muted>
          The same strip in grayscale, reads as neutral text
        </Text>
        <Card padding={3} radius={2} shadow={1} style={{filter: 'grayscale(1)'}}>
          <TextWithTone tone="critical" size={1}>
            Dude, UPPERCASE!
          </TextWithTone>
        </Card>
      </Stack>
    </Stack>
  ),
}

/**
 * **Recommended.** Keep the tone, but lead with an icon that carries the meaning by
 * shape, an error triangle, a warning, a check, an info. The message now reads as an
 * error before colour is perceived, and survives grayscale. Uses the real
 * `TextWithTone` for the text; the icon is the added shape cue.
 */
export const Recommended: Story = {
  name: 'similarity, Recommended (icon + toned text)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {controls: {include: []}},
  render: () => {
    const rows: {tone: ButtonTone; icon: typeof ErrorOutlineIcon; text: string}[] = [
      {tone: 'critical', icon: ErrorOutlineIcon, text: 'Dude, UPPERCASE!'},
      {tone: 'caution', icon: WarningOutlineIcon, text: 'This will publish immediately'},
      {tone: 'positive', icon: CheckmarkCircleIcon, text: 'Saved just now'},
      {tone: 'primary', icon: InfoOutlineIcon, text: 'Used in 3 other documents'},
    ]
    const Legible = ({grayscale}: {grayscale?: boolean}) => (
      <Card
        padding={3}
        radius={2}
        shadow={1}
        style={grayscale ? {filter: 'grayscale(1)'} : undefined}
      >
        <Stack gap={3}>
          {rows.map(({tone, icon: Icon, text}) => (
            <Flex key={text} gap={2} align="center">
              <TextWithTone tone={tone} size={1}>
                <Icon />
              </TextWithTone>
              <TextWithTone tone={tone} size={1}>
                {text}
              </TextWithTone>
            </Flex>
          ))}
        </Stack>
      </Card>
    )
    return (
      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={1} weight="medium">
            Icon + toned text, legible with colour
          </Text>
          <Legible />
        </Stack>
        <Stack gap={2}>
          <Text size={1} weight="medium" muted>
            The same rows in grayscale, still legible
          </Text>
          <Legible grayscale />
        </Stack>
      </Stack>
    )
  },
}

/**
 * **In context.** The validation summary for the book *Anna Karenina* mid-edit, the panel
 * that gathers each field's status into one place. Every coloured line here is the real
 * `TextWithTone` doing its actual job: a critical error on the required Title, a caution on
 * a publish date already in the past, a positive confirmation on the resolved author, an
 * informational note on a reused summary. This is the tinting primitive at work across a
 * real document's field-status readout.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    const items: {field: string; tone: ButtonTone; message: string}[] = [
      {field: 'Title', tone: 'critical', message: 'Required, cannot be empty'},
      {field: 'Publish date', tone: 'caution', message: 'In the past, publishes immediately'},
      {field: 'Author', tone: 'positive', message: 'Resolved to Leo Tolstoy'},
      {field: 'Summary', tone: 'primary', message: 'Used in 3 other documents'},
    ]
    return (
      <Card padding={3} radius={2} shadow={1} style={{maxWidth: 380}}>
        <Stack gap={3}>
          <Text size={1} weight="semibold">
            Anna Karenina · validation
          </Text>
          <Stack gap={3}>
            {items.map(({field, tone, message}) => (
              <Flex key={field} gap={3} align="center" justify="space-between">
                <Text size={1} muted>
                  {field}
                </Text>
                <TextWithTone tone={tone} size={1}>
                  {message}
                </TextWithTone>
              </Flex>
            ))}
          </Stack>
        </Stack>
      </Card>
    )
  },
}
