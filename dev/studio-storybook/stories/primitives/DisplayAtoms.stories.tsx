import {
  Avatar,
  type AvatarSize,
  AvatarStack,
  Badge,
  Box,
  Code,
  Flex,
  Heading,
  Inline,
  Label,
  Stack,
  Text,
} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {matrixBuilder, PxCaption, SchemeCompare} from '../../lib/matrixBuilder'

const meta: Meta = {
  title: 'UI v3 Primitives/Display',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Every pane header, field label, hint, code sample, and presence cursor in Studio renders ' +
            'through one of these five atoms, and none of their sizes are eyeballed: each resolves to ' +
            'a fixed pixel value from the theme, so reading a ladder turns a size choice into a ' +
            'measured decision instead of a habit.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `@sanity/ui` primitives: the four type roles (`Text`, `Heading`, `Code`, `Label`), the status chip (`Badge`), the collaborator glyph (`Avatar`) |',
          '| Tier | ATOM. Consumed everywhere: every pane header a `Heading`, every field label a `Label`, every hint a muted `Text`, every Vision result a `Code` block, every presence cursor an `Avatar` |',
          '| Audit | ⚪ not-audited as a unit; instances inherit whatever the consuming component’s audit found |',
          '| Patterns | `typography` |',
          '| Scale | Text 10/13/15/18/21px · Heading 13/16/21/27/33/38px · Code 10/13/16/19/22px · Label 8.1/9.5/10.8/12.25/13.6/15px |',
          '',
          'The type scale is 0-indexed and resolves to those fixed pixel sizes, the same numbers the ' +
            'theme ships. Each ladder below walks the full range for one role.',
          '',
          '> **Why it matters:** Label at size 0 sits at 8.1px, below a comfortable legibility floor ' +
            '(design law 8). The ladder makes that floor a visible decision, not an accident.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:foundations', 'pattern:typography', 'source:sanity-ui', 'tier:atom'],
}

export default meta
type Story = StoryObj

// Resolved pixel sizes from @sanity/ui's default theme fonts (theme/defaults/fonts.ts).
const TEXT_PX = [10, 13, 15, 18, 21]
const HEADING_PX = [13, 16, 21, 27, 33, 38]
const CODE_PX = [10, 13, 16, 19, 22]
const LABEL_PX = [8.1, 9.5, 10.8, 12.25, 13.6, 15]

/**
 * `Text` is the body role, and the most-rendered atom in Studio (hints, values, descriptions).
 * The ladder walks the full 0→4 scale; note size 1 (13px) is the workhorse for secondary/muted
 * copy and size 2 (15px) for primary field text.
 */
export const TextScale: Story = {
  name: 'Text · size ladder',
  render: () => (
    <SchemeCompare
      render={() => (
        <Stack gap={4}>
          {TEXT_PX.map((px, size) => (
            <Flex key={px} align="baseline" gap={4}>
              <Box style={{width: 64}}>
                <PxCaption label={`size ${size}`} px={px} />
              </Box>
              <Text size={size}>The quick brown fox</Text>
            </Flex>
          ))}
        </Stack>
      )}
    />
  ),
}

/**
 * `Heading` is the title role, a heavier weight and a taller scale than `Text`. Pane titles land
 * at size 1–2 (16–21px); a document title header at size 2–3.
 */
export const HeadingScale: Story = {
  name: 'Heading · size ladder',
  render: () => (
    <SchemeCompare
      render={() => (
        <Stack gap={4}>
          {HEADING_PX.map((px, size) => (
            <Flex key={px} align="baseline" gap={4}>
              <Box style={{width: 64}}>
                <PxCaption label={`size ${size}`} px={px} />
              </Box>
              <Heading size={size}>Structured content</Heading>
            </Flex>
          ))}
        </Stack>
      )}
    />
  ),
}

/**
 * `Code` is the monospace role, the atom Vision renders GROQ and results in. The mono stack is
 * OS-native (no webfont), so the glyphs are whatever the viewer's system ships.
 */
export const CodeScale: Story = {
  name: 'Code · size ladder',
  render: () => (
    <SchemeCompare
      render={() => (
        <Stack gap={4}>
          {CODE_PX.map((px, size) => (
            <Flex key={px} align="center" gap={4}>
              <Box style={{width: 64}}>
                <PxCaption label={`size ${size}`} px={px} />
              </Box>
              <Code size={size}>{'*[_type == "post"]'}</Code>
            </Flex>
          ))}
        </Stack>
      )}
    />
  ),
}

/**
 * `Label` is the smallest role: uppercase, letter-spaced, for section eyebrows and field group
 * headers. This is the atom design law 8 warns about, at size 0 (8.1px) it is below a
 * comfortable legibility floor. The ladder is here so the floor is a visible decision, not an
 * accident.
 */
export const LabelScale: Story = {
  name: 'Label · size ladder',
  render: () => (
    <SchemeCompare
      render={() => (
        <Stack gap={4}>
          {LABEL_PX.map((px, size) => (
            <Flex key={px} align="center" gap={4}>
              <Box style={{width: 64}}>
                <PxCaption label={`size ${size}`} px={px} />
              </Box>
              <Label size={size}>Section header</Label>
            </Flex>
          ))}
        </Stack>
      )}
    />
  ),
}

const BADGE_TONES = ['default', 'neutral', 'suggest', 'positive', 'caution', 'critical'] as const
const BADGE_MODES = ['default', 'outline'] as const

/**
 * `Badge` is the status chip, read across every tone (rows). `mode` is deprecated and no longer
 * changes rendering, so the two mode columns render identically here on purpose, that is the
 * current, accurate behaviour. Studio uses tone to carry meaning: `positive` for published,
 * `caution` for a draft/unpublished, and `critical` for a validation error. The matrix renders in
 * both schemes so you can confirm the tone stays legible on either background.
 */
export const BadgeMatrix: Story = {
  name: 'Badge · tone × mode',
  render: () => (
    <SchemeCompare
      frame={false}
      render={(scheme) =>
        matrixBuilder({
          scheme,
          columns: BADGE_MODES,
          rows: BADGE_TONES,
          title: 'Badge',
          renderItem: ({row, column}) => (
            <Flex key={`${row}-${column}`} align="center" justify="center">
              {/* oxlint-disable-next-line no-deprecated -- intentional: demonstrates that mode no longer affects rendering */}
              <Badge tone={row} mode={column}>
                {row}
              </Badge>
            </Flex>
          ),
        })
      }
    />
  ),
}

// Avatar sizes resolve to fixed diameters (theme/defaults/config.ts avatar.sizes).
const AVATAR_PX = [19, 25, 33, 49]
const AVATAR_COLORS = ['blue', 'purple', 'magenta', 'orange', 'green', 'cyan'] as const

/**
 * `Avatar` is the collaborator glyph behind presence cursors and comment authors. The size ladder
 * labels the real diameters; the color row is the deterministic per-user hue (`@sanity/color`
 * hues). `AvatarStack` overlaps them for "N people here".
 */
export const AvatarScale: Story = {
  name: 'Avatar · sizes, colors, stack',
  render: () => (
    <SchemeCompare
      render={() => (
        <Stack gap={5}>
          <Flex align="flex-end" gap={4}>
            {AVATAR_PX.map((px, size) => (
              <Stack key={px} gap={3} style={{alignItems: 'center'}}>
                <Avatar initials="FH" color="blue" size={size as AvatarSize} />
                <PxCaption label={`size ${size}`} px={px} />
              </Stack>
            ))}
          </Flex>
          <Inline gap={2}>
            {AVATAR_COLORS.map((color, i) => (
              <Avatar key={color} initials={String.fromCharCode(65 + i)} color={color} size={1} />
            ))}
          </Inline>
          <Box>
            <AvatarStack maxLength={4}>
              {AVATAR_COLORS.map((color, i) => (
                <Avatar key={color} initials={String.fromCharCode(65 + i)} color={color} size={1} />
              ))}
            </AvatarStack>
          </Box>
        </Stack>
      )}
    />
  ),
}
