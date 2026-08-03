import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {CircleIcon} from '@sanity/icons/Circle'
import {ClockIcon} from '@sanity/icons/Clock'
import {EditIcon} from '@sanity/icons/Edit'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type ThemeColorStateToneKey} from '@sanity/ui/theme'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// ToneIcon is NOT re-exported from the `sanity` ui-components barrel (unlike
// Button/Dialog/ErrorBoundary), so the source file is the only way in. These
// stories are the only place it renders standalone. KNOWN GOTCHA: ToneIcon only
// sets `--card-icon-color`; the CSS rule that consumes it lives on @sanity/ui's
// <Text>, so every real call site wraps it in <Text> — the stories do the same.
import {ToneIcon} from '../../../../packages/sanity/src/ui-components/toneIcon/ToneIcon'

const TONES: ThemeColorStateToneKey[] = [
  'default',
  'neutral',
  'primary',
  'suggest',
  'positive',
  'caution',
  'critical',
]

const meta: Meta<typeof ToneIcon> = {
  title: 'Lists & Data/ToneIcon',
  component: ToneIcon,
  args: {tone: 'critical', icon: ErrorOutlineIcon},
  argTypes: {
    tone: {control: 'select', options: TONES},
  },
  // Wrap every story in <Text>: ToneIcon's color only resolves through Text's
  // svg color rule (the gotcha above).
  render: (props) => (
    <Text size={2}>
      <ToneIcon {...props} />
    </Text>
  ),
  parameters: {
    docs: {
      description: {
        component: [
          'A lot of status in Studio rides on a single tinted glyph: a positive-green check, a ' +
            'caution-amber clock, a critical-red warning. ToneIcon is the small shared primitive ' +
            'that does that tinting, so every status glyph across the app pulls from the same ' +
            'palette.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/ui-components/toneIcon/ToneIcon.tsx`, Studio-only (no DS equivalent) |',
          '| Tier | CHROME. A pure presentation atom: it maps a `tone` key to a themed CSS colour variable on an icon, zero domain logic |',
          '| Audit | 🔴 needs-work (`similarity`, `draft-publish-lifecycle`). The audit found document status rendered as colour-only dots of identical shape and size, so status is unreadable to colourblind users and to anyone scanning shape |',
          '| Patterns | `similarity` · `draft-publish-lifecycle` |',
          '',
          'Hand it any `@sanity/icons` glyph and a `tone` key and it renders the icon in the theme colour for that status. Wraps any `@sanity/icons` glyph and tints it with the theme `--card-badge-<tone>-icon-color` variable. It is the shared tinting primitive behind status glyphs across Releases, Variants, and the perspective menu. The gotcha: ToneIcon only writes the `--card-icon-color` custom property, the rule that reads it lives on `@sanity/ui` `<Text>`, so it must be nested in a `<Text>` (as every real call site does) or it renders in the inherited text colour.',
          '',
          'Addressed for `similarity` looks like the `Current` vs `Recommended` pair below: pairing each tone with a distinct icon shape and a text label so the status survives a grayscale render.',
          '',
          '> **Why it matters:** ToneIcon writes a CSS custom property; a surrounding text element applies the colour. Drop it anywhere that is not inside that element and the tone is silently ignored: the icon renders in the inherited text colour, exactly as the wrap-gotcha story shows.',
          '',
          'The page closes **in context**: the validation summary for the "Anna Karenina" draft, each field issue led by a tone-coloured status glyph.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:lawsofux',
    'chapter:cms',
    'pattern:similarity',
    'pattern:draft-publish-lifecycle',
    'audit:needs-work',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof ToneIcon>

/** Playground: pick a tone from the controls. */
export const Default: Story = {}

/** The full tone matrix, each glyph nested in <Text> so the tint resolves. */
export const ToneMatrix: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={4} wrap="wrap">
      {TONES.map((tone) => (
        <Stack key={tone} gap={2} style={{textAlign: 'center'}}>
          <Text size={4}>
            <ToneIcon icon={ErrorOutlineIcon} tone={tone} />
          </Text>
          <Text size={0} muted>
            {tone}
          </Text>
        </Stack>
      ))}
    </Flex>
  ),
}

/**
 * The gotcha, made visible: the same ToneIcon inside <Text> (tinted) and
 * outside it (falls back to inherited color, tone ignored).
 */
export const TextWrapGotcha: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={5} align="center">
      <Stack gap={2} style={{textAlign: 'center'}}>
        <Text size={4}>
          <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
        </Text>
        <Text size={0} muted>
          inside &lt;Text&gt;, tinted critical
        </Text>
      </Stack>
      <Stack gap={2} style={{textAlign: 'center'}}>
        {/* Deliberately NOT wrapped in <Text>: the tone is ignored. */}
        <div style={{fontSize: 33}}>
          <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
        </div>
        <Text size={0} muted>
          no &lt;Text&gt;, tone ignored
        </Text>
      </Stack>
    </Flex>
  ),
}

/**
 * Audit `similarity`: Current: document status as color-only dots. Every dot
 * is the same filled circle at the same size; only the hue differs, so the
 * status is invisible in grayscale or to colorblind editors.
 */
export const Current: Story = {
  name: 'similarity · Current (color-only dots)',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'Reproduces the audit finding: status conveyed by hue alone. Four identical `CircleIcon` dots differing only in tone, indistinguishable once color is removed.',
      },
    },
  },
  render: () => (
    <Flex gap={4}>
      {(['critical', 'caution', 'positive', 'default'] as const).map((tone) => (
        <Text key={tone} size={3}>
          <ToneIcon icon={CircleIcon} tone={tone} />
        </Text>
      ))}
    </Flex>
  ),
}

/**
 * Audit `similarity`: Recommended: keep the tone, but give each status a
 * distinct icon shape and a text label, so it reads without relying on color.
 */
export const Recommended: Story = {
  name: 'similarity · Recommended (shape + label per status)',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        story:
          'The resolved state: tone is retained but paired with a distinct glyph shape and a label per status. Survives a grayscale render and passes non-color status signalling.',
      },
    },
  },
  render: () => {
    const statuses: {label: string; tone: ThemeColorStateToneKey; icon: typeof CircleIcon}[] = [
      {label: 'Error', tone: 'critical', icon: ErrorOutlineIcon},
      {label: 'Scheduled', tone: 'caution', icon: ClockIcon},
      {label: 'Published', tone: 'positive', icon: CheckmarkCircleIcon},
      {label: 'Edited', tone: 'default', icon: EditIcon},
    ]
    return (
      <Stack gap={3}>
        {statuses.map(({label, tone, icon}) => (
          <Flex key={label} gap={2} align="center">
            <Text size={2}>
              <ToneIcon icon={icon} tone={tone} />
            </Text>
            <Text size={1}>{label}</Text>
          </Flex>
        ))}
      </Stack>
    )
  },
}

/**
 * In context: the validation summary for the "Anna Karenina" draft. Each field
 * issue leads with a ToneIcon in its status colour (a critical error, a caution
 * warning, a primary hint), every glyph nested in `<Text>` so the tint resolves,
 * the exact pattern behind Studio's errors-and-warnings panel.
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    const issues: {
      field: string
      message: string
      tone: ThemeColorStateToneKey
      icon: typeof ErrorOutlineIcon
    }[] = [
      {
        field: 'Author',
        message: 'Required: every book needs an author',
        tone: 'critical',
        icon: ErrorOutlineIcon,
      },
      {
        field: 'Publication year',
        message: 'Should be four digits',
        tone: 'caution',
        icon: WarningOutlineIcon,
      },
      {
        field: 'Summary',
        message: 'Add a short description to improve previews',
        tone: 'primary',
        icon: InfoOutlineIcon,
      },
    ]
    return (
      <Card border radius={2} shadow={1} padding={2} style={{maxWidth: 360}}>
        <Stack gap={1}>
          <Box padding={2}>
            <Text size={0} weight="semibold" muted style={{textTransform: 'uppercase'}}>
              Validation · Anna Karenina
            </Text>
          </Box>
          {issues.map(({field, message, tone, icon}) => (
            <Card key={field} radius={2} padding={2} tone="transparent">
              <Flex gap={3} align="flex-start">
                <Text size={2}>
                  <ToneIcon icon={icon} tone={tone} />
                </Text>
                <Stack gap={2}>
                  <Text size={1} weight="medium">
                    {field}
                  </Text>
                  <Text size={1} muted>
                    {message}
                  </Text>
                </Stack>
              </Flex>
            </Card>
          ))}
        </Stack>
      </Card>
    )
  },
}
