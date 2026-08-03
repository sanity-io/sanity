import {
  Box,
  Button as UIButton,
  Card,
  Code,
  Flex,
  Label,
  Stack,
  studioTheme,
  Text,
  ThemeProvider,
  useRootTheme,
} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

const meta: Meta = {
  title: 'Foundations/Theme Matrix',
  parameters: {
    docs: {
      description: {
        component: [
          'Every swatch on this page is a live component, not a screenshot, so the color matrix ' +
            'and its measured contrast numbers can never drift apart.',
          '',
          '| | |',
          '|---|---|',
          '| Source | catalog foundations; swatches are real `@sanity/ui` `Card`s and `Button`s under nested `ThemeProvider`s (one per scheme), annotations read the same `buildTheme()` data the providers render with, so swatch and number cannot disagree |',
          '| Tier | n/a, foundations ground floor. The light × dark × tone matrix the original organization contract (§1) called for and no component page could own |',
          '| Audit | ⚪ not-audited as a unit, but the **Card states** story surfaces the theme fact behind a real finding: the `disabled` column sits at ≈1.3:1 in both schemes, which is exactly what makes the calendar’s disabled days functionally invisible (see `Foundations/Typography` → Contrast baselines, and the `CMS Patterns/Schedule Form` ledger note) |',
          '',
          'Studio’s color system is **two schemes × five tones** (`default`, `primary`, ' +
            '`positive`, `caution`, `critical`), each tone resolving a full set of surfaces: ' +
            '`base` (the tinted card the tone paints), `solid` (filled buttons and badges), ' +
            '`muted`, and stateful `card` colors (enabled → hovered → pressed → selected → ' +
            'disabled). Components never hold hexes; they name a tone and the scheme resolves it. ' +
            'Every swatch here is a live component under a scheme-pinned provider rather than a ' +
            'painted rectangle.',
          '',
          'Click any cell in **Base tones** to open it in the inspector: background, ' +
            'foreground, border and focus-ring hexes with computed WCAG ratios. **Solid tones** ' +
            'shows the filled layer that buttons wear. **Card states** renders the interaction ' +
            'ladder for the scheme picked in the toolbar, and flags the disabled rung’s contrast.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:systems', 'pattern:design-tokens'],
}

export default meta
type Story = StoryObj

const SCHEMES = ['light', 'dark'] as const
const TONES = ['default', 'primary', 'positive', 'caution', 'critical'] as const
const CARD_STATES = ['enabled', 'hovered', 'pressed', 'selected', 'disabled'] as const

type SchemeKey = (typeof SCHEMES)[number]
type ToneKey = (typeof TONES)[number]

const THEME = buildTheme()

function luminance(hex: string): number {
  const channel = (i: number) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** A scheme-pinned island: whatever the toolbar says, this subtree renders `scheme`. */
function SchemeIsland({scheme, children}: {scheme: SchemeKey; children: React.ReactNode}) {
  return (
    // oxlint-disable-next-line no-deprecated -- matches real usage in packages/sanity/src/core/studio/colorScheme.tsx; not yet migrated anywhere in the real Studio source
    <ThemeProvider theme={studioTheme} scheme={scheme}>
      {children}
    </ThemeProvider>
  )
}

// --- Base tones ------------------------------------------------------------------

function BaseCell({
  scheme,
  tone,
  selected,
  onSelect,
}: {
  scheme: SchemeKey
  tone: ToneKey
  selected: boolean
  onSelect: () => void
}) {
  return (
    <SchemeIsland scheme={scheme}>
      <Card
        as="button"
        tone={tone}
        border
        radius={2}
        padding={3}
        onClick={onSelect}
        style={{
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          outline: selected ? '2px solid rgba(128,128,128,0.8)' : undefined,
          outlineOffset: 2,
        }}
      >
        <Stack gap={2}>
          <Text size={2} weight="semibold">
            Aa
          </Text>
          <Text size={1} muted>
            muted
          </Text>
        </Stack>
      </Card>
    </SchemeIsland>
  )
}

function BaseInspector({scheme, tone}: {scheme: SchemeKey; tone: ToneKey}) {
  // oxlint-disable-next-line no-deprecated -- v2 color namespace not yet adopted anywhere in packages/sanity/src; v1 remains fully functional pending a real migration
  const color = THEME.color[scheme][tone]
  const {base} = color
  const mutedFg = color.card.enabled.muted.fg
  const rows: Array<[string, string, number | null]> = [
    ['bg', base.bg, null],
    ['fg', base.fg, contrastRatio(base.fg, base.bg)],
    ['muted fg', mutedFg, contrastRatio(mutedFg, base.bg)],
    ['border', base.border, contrastRatio(base.border, base.bg)],
    ['focus ring', base.focusRing, null],
  ]

  return (
    <Card border radius={2} padding={4}>
      <Stack gap={3}>
        <Label size={1}>{`Inspector: ${scheme} · ${tone}`}</Label>
        {rows.map(([name, hex, ratio]) => (
          <Flex key={name} align="center" gap={3}>
            <Box style={{width: 80}}>
              <Text size={1} muted>
                {name}
              </Text>
            </Box>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: hex,
                border: '1px solid rgba(128,128,128,0.5)',
                flexShrink: 0,
              }}
            />
            <Code size={1}>{hex}</Code>
            {ratio !== null && (
              <Text size={1} muted>{`${ratio.toFixed(2)}:1 on bg${
                ratio < 4.5 && name !== 'border' ? ', below AA 4.5:1' : ''
              }`}</Text>
            )}
          </Flex>
        ))}
      </Stack>
    </Card>
  )
}

function BaseTonesDemo() {
  const [selected, setSelected] = useState<{scheme: SchemeKey; tone: ToneKey}>({
    scheme: 'dark',
    tone: 'primary',
  })

  return (
    <Stack gap={4} style={{maxWidth: 720}}>
      <Flex gap={3}>
        <Box style={{width: 90, flexShrink: 0}} />
        {SCHEMES.map((scheme) => (
          <Box key={scheme} flex={1}>
            <Label size={1} muted>
              {scheme}
            </Label>
          </Box>
        ))}
      </Flex>
      {TONES.map((tone) => (
        <Flex key={tone} gap={3} align="center">
          <Box style={{width: 90, flexShrink: 0}}>
            <Text size={1} weight="semibold">
              {tone}
            </Text>
          </Box>
          {SCHEMES.map((scheme) => (
            <Box key={scheme} flex={1}>
              <BaseCell
                scheme={scheme}
                tone={tone}
                selected={selected.scheme === scheme && selected.tone === tone}
                onSelect={() => setSelected({scheme, tone})}
              />
            </Box>
          ))}
        </Flex>
      ))}
      <BaseInspector scheme={selected.scheme} tone={selected.tone} />
    </Stack>
  )
}

/**
 * The base layer: five tones × two schemes, each cell a real `Card tone={…}` under a
 * scheme-pinned provider. Click a cell to inspect its bg / fg / muted / border /
 * focus-ring hexes with computed contrast ratios.
 */
export const BaseTones: Story = {
  name: 'Base tones · light × dark',
  render: () => <BaseTonesDemo />,
}

// --- Solid tones -----------------------------------------------------------------

function SolidTonesDemo() {
  return (
    <Stack gap={4} style={{maxWidth: 720}}>
      <Flex gap={3}>
        <Box style={{width: 90, flexShrink: 0}} />
        {SCHEMES.map((scheme) => (
          <Box key={scheme} flex={1}>
            <Label size={1} muted>
              {scheme}
            </Label>
          </Box>
        ))}
      </Flex>
      {TONES.map((tone) => (
        <Flex key={tone} gap={3} align="center">
          <Box style={{width: 90, flexShrink: 0}}>
            <Text size={1} weight="semibold">
              {tone}
            </Text>
          </Box>
          {SCHEMES.map((scheme) => {
            // oxlint-disable-next-line no-deprecated -- v2 color namespace not yet adopted anywhere in packages/sanity/src; v1 remains fully functional pending a real migration
            const solid = THEME.color[scheme].default.solid[tone].enabled
            return (
              <Box key={scheme} flex={1}>
                <SchemeIsland scheme={scheme}>
                  <Card padding={3} radius={2} border>
                    <Stack gap={3}>
                      <UIButton tone={tone} text={tone} fontSize={1} style={{width: '100%'}} />
                      <Flex align="center" gap={2} wrap="wrap">
                        <Code size={0}>{`${solid.fg} on ${solid.bg}`}</Code>
                        <Text size={0} muted>
                          {`${contrastRatio(solid.fg, solid.bg).toFixed(2)}:1`}
                        </Text>
                      </Flex>
                    </Stack>
                  </Card>
                </SchemeIsland>
              </Box>
            )
          })}
        </Flex>
      ))}
      <Text size={1} muted>
        Real `@sanity/ui` Buttons on a default surface; annotations read
        `color.default.solid[tone].enabled`, the layer badges and filled controls wear.
      </Text>
    </Stack>
  )
}

/**
 * The solid layer: what filled buttons and badges render in each tone and scheme,
 * with the fg-on-bg ratio each pairing yields.
 */
export const SolidTones: Story = {
  name: 'Solid tones · light × dark',
  render: () => <SolidTonesDemo />,
}

// --- Card states -----------------------------------------------------------------

function CardStatesDemo() {
  const root = useRootTheme()
  const scheme: SchemeKey = root.scheme === 'dark' ? 'dark' : 'light'
  // oxlint-disable-next-line no-deprecated -- v2 color namespace not yet adopted anywhere in packages/sanity/src; v1 remains fully functional pending a real migration
  const baseBg = THEME.color[scheme].default.base.bg

  return (
    <Stack gap={4} style={{maxWidth: 860}}>
      <Label
        size={1}
      >{`Card interaction states, ${scheme} scheme (follows the toolbar toggle)`}</Label>
      <Flex gap={2}>
        <Box style={{width: 90, flexShrink: 0}} />
        {CARD_STATES.map((state) => (
          <Box key={state} flex={1}>
            <Label size={0} muted>
              {state}
            </Label>
          </Box>
        ))}
      </Flex>
      {TONES.map((tone) => (
        <Flex key={tone} gap={2} align="center">
          <Box style={{width: 90, flexShrink: 0}}>
            <Text size={1} weight="semibold">
              {tone}
            </Text>
          </Box>
          {CARD_STATES.map((state) => {
            // oxlint-disable-next-line no-deprecated -- v2 color namespace not yet adopted anywhere in packages/sanity/src; v1 remains fully functional pending a real migration
            const stateColor = THEME.color[scheme][tone].card[state]
            const bg = stateColor.bg === 'transparent' ? baseBg : stateColor.bg
            const ratio = contrastRatio(stateColor.fg, bg)
            const failing = ratio < 3
            return (
              <Box key={state} flex={1}>
                <div
                  style={{
                    background: bg,
                    color: stateColor.fg,
                    border: failing
                      ? '1px dashed rgba(240,62,47,0.7)'
                      : `1px solid ${stateColor.border}`,
                    borderRadius: 4,
                    padding: '10px 8px',
                    textAlign: 'center',
                    fontSize: 13,
                    lineHeight: '19px',
                  }}
                >
                  {`Aa ${ratio.toFixed(1)}:1`}
                </div>
              </Box>
            )
          })}
        </Flex>
      ))}
      <Text size={1} muted>
        Chips are painted straight from `color[scheme][tone].card[state]`, these states cannot be
        forced onto a live Card, so the theme data itself is the specimen. The dashed red ring marks
        pairs under 3:1: the entire `disabled` column, at ≈1.3:1, is the token decision behind the
        invisible calendar days (Typography → Contrast baselines).
      </Text>
    </Stack>
  )
}

/**
 * The interaction ladder: enabled through disabled for every tone, in the scheme
 * selected in the toolbar, each rung carrying its computed fg/bg ratio. The disabled
 * column’s ≈1.3:1 is a theme fact with a real defect attached.
 */
export const CardStates: Story = {
  name: 'Card states',
  tags: ['audit:needs-work'],
  render: () => <CardStatesDemo />,
}
