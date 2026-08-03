import {
  Avatar,
  type AvatarSize,
  Box,
  Button as UIButton,
  Card,
  Code,
  Flex,
  Label,
  Stack,
  studioTheme,
  Text,
  TextInput,
  ThemeProvider,
} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useEffect, useLayoutEffect, useRef, useState} from 'react'

// The raw palette layer. studio-storybook does not depend on @sanity/color directly
// (pnpm isolates it), and adding a dependency mid-program would churn the lockfile
// for every crew — so the import walks into packages/sanity's own copy, the exact
// palette Studio itself compiles against.
import {
  black,
  COLOR_HUES,
  COLOR_TINTS,
  hues,
  white,
} from '../../../../packages/sanity/node_modules/@sanity/color/dist/index.js'

const meta: Meta = {
  title: 'Foundations/Design Tokens',
  parameters: {
    docs: {
      description: {
        component: [
          'Studio’s token stack has three layers, palette, theme and runtime, and every value ' +
            'on this page is read live rather than transcribed, so this is where you find a value ' +
            'fast and trust it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | catalog foundations; the palette layer is `@sanity/color` (the exact copy `packages/sanity` compiles against) and every other value is read from the `@sanity/ui` theme at render time, nothing on this page is transcribed |',
          '| Tier | n/a, foundations ground floor: the raw values. Principles and reading specimens live on `Foundations/Typography`; semantic tone resolution lives on `Foundations/Theme Matrix`; this page is where you find a value fast |',
          '| Audit | ⚪ not-audited as a unit, but two families carry program findings: **Container** holds the very tokens the Dialog width study proposes renumbering (`Overlays & Navigation/Dialog`), and the card-property pipeline shown here is the mechanism behind the disabled-contrast finding (`Foundations/Theme Matrix` → Card states) |',
          '',
          '**Palette** (`@sanity/color`): 9 hues × 11 tints plus black and white, inert hex ' +
            'values, no meaning attached. **Theme** (`buildTheme()`): the palette resolved into ' +
            'semantic slots, tones, card states, spacing, radii, shadows, containers, layers, ' +
            'breakpoints. **Runtime** (`--card-*`): when a `Card` takes a tone, it emits ~73 CSS ' +
            'custom properties onto its DOM element; every descendant styles itself with ' +
            '`var(--card-…)` and never sees a hex. The stories below walk the stack top to ' +
            'bottom, each family with name, value, and a live specimen. How the layers connect is ' +
            'taught on `Foundations/Design System Tooling`.',
          '',
          'Families on this page: **Palette** · **Card properties** (the runtime layer, ' +
            'computed live) · **Space** · **Radius** · **Shadows** · **Container** · **Layer** · ' +
            '**Breakpoints** · **Avatar sizes** · **Type tokens**.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:systems', 'pattern:design-tokens'],
}

export default meta
type Story = StoryObj

const THEME = buildTheme()
// v2 is always populated by buildTheme(); the library's own type marks it optional for callers
// that build a theme via a lower-level API that can skip it.
const THEME_V2 = THEME.v2!
const SCHEMES = ['light', 'dark'] as const
const TONES = ['default', 'primary', 'positive', 'caution', 'critical'] as const
type SchemeKey = (typeof SCHEMES)[number]
type ToneKey = (typeof TONES)[number]

/** Quiet monospace annotation — instrumentation size (see Typography: the size floor). */
function Annotation({children}: {children: React.ReactNode}) {
  return (
    <Code size={0} style={{whiteSpace: 'nowrap'}}>
      {children}
    </Code>
  )
}

// --- Palette ---------------------------------------------------------------------

const HUE_NAMES = COLOR_HUES

function PaletteDemo() {
  const [selected, setSelected] = useState<{title: string; hex: string}>(hues.blue[500])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(timer)
  }, [copied])

  const pick = (tint: {title: string; hex: string}) => {
    setSelected(tint)
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tint.hex).then(
        () => setCopied(true),
        () => {},
      )
    }
  }

  return (
    <Stack gap={4} style={{maxWidth: 760}}>
      <Card border radius={2} padding={3}>
        <Flex align="center" gap={3}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 5,
              background: selected.hex,
              border: '1px solid rgba(128,128,128,0.4)',
            }}
          />
          <Text size={1} weight="semibold">
            {selected.title}
          </Text>
          <Annotation>{selected.hex}</Annotation>
          {copied && (
            <Text size={1} muted>
              copied
            </Text>
          )}
        </Flex>
      </Card>

      <Stack gap={2}>
        {HUE_NAMES.map((hueName) => (
          <Flex key={hueName} align="center" gap={2}>
            <Box style={{width: 64, flexShrink: 0}}>
              <Text size={1}>{hueName}</Text>
            </Box>
            <Flex gap={1} flex={1}>
              {COLOR_TINTS.map((tintKey) => {
                const tint = hues[hueName][tintKey]
                return (
                  <button
                    key={tintKey}
                    type="button"
                    aria-label={`${tint.title} ${tint.hex}`}
                    title={`${tint.title} · ${tint.hex}`}
                    onClick={() => pick(tint)}
                    style={{
                      flex: 1,
                      height: 26,
                      background: tint.hex,
                      border:
                        selected.hex === tint.hex
                          ? '2px solid rgba(128,128,128,0.9)'
                          : '1px solid rgba(128,128,128,0.25)',
                      borderRadius: 3,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                )
              })}
            </Flex>
          </Flex>
        ))}
        <Flex align="center" gap={2}>
          <Box style={{width: 64, flexShrink: 0}}>
            <Text size={1}>b / w</Text>
          </Box>
          <Flex gap={1}>
            {[black, white].map((tint) => (
              <button
                key={tint.hex}
                type="button"
                aria-label={`${tint.title} ${tint.hex}`}
                title={`${tint.title} · ${tint.hex}`}
                onClick={() => pick(tint)}
                style={{
                  width: 52,
                  height: 26,
                  background: tint.hex,
                  border: '1px solid rgba(128,128,128,0.4)',
                  borderRadius: 3,
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </Flex>
        </Flex>
      </Stack>

      <Flex justify="space-between">
        <Text size={0} muted>
          tint 50 (lightest)
        </Text>
        <Text size={0} muted>
          tint 950 (darkest)
        </Text>
      </Flex>
    </Stack>
  )
}

/**
 * The source layer: `@sanity/color`, 9 hues × 11 tints plus black and white. These
 * hexes carry no meaning by themselves; `buildTheme()` assigns them to semantic slots.
 * Click any swatch to inspect and copy its hex.
 */
export const Palette: Story = {
  render: () => <PaletteDemo />,
}

// --- Card properties (the runtime layer) -----------------------------------------

// The core third of the ~73 custom properties a toned Card emits; the remaining two
// thirds are the badge (7 tones × 4) and avatar (9 hues × 2) families.
const CORE_CARD_VARS = [
  '--card-bg-color',
  '--card-fg-color',
  '--card-muted-bg-color',
  '--card-muted-fg-color',
  '--card-accent-fg-color',
  '--card-icon-color',
  '--card-border-color',
  '--card-focus-ring-color',
  '--card-link-color',
  '--card-code-bg-color',
  '--card-code-fg-color',
  '--card-kbd-bg-color',
  '--card-kbd-fg-color',
  '--card-kbd-border-color',
  '--card-hairline-soft-color',
  '--card-hairline-hard-color',
  '--card-skeleton-color-from',
  '--card-skeleton-color-to',
  '--card-shadow-umbra-color',
  '--card-shadow-outline-color',
] as const

function CardVarReadout() {
  const probeRef = useRef<HTMLDivElement | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})

  // Custom properties inherit down the DOM, so a probe inside the Card reads the
  // exact values every descendant component consumes.
  useLayoutEffect(() => {
    const el = probeRef.current
    if (!el) return
    const style = getComputedStyle(el)
    const next: Record<string, string> = {}
    for (const cssVar of CORE_CARD_VARS) next[cssVar] = style.getPropertyValue(cssVar).trim()
    setValues(next)
  }, [])

  return (
    <div ref={probeRef}>
      <Stack gap={2}>
        {CORE_CARD_VARS.map((cssVar) => (
          <Flex key={cssVar} align="center" gap={2}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                background: values[cssVar] || 'transparent',
                border: '1px solid var(--card-hairline-hard-color)',
                flexShrink: 0,
              }}
            />
            <Box style={{width: 240, flexShrink: 0}}>
              <Annotation>{cssVar}</Annotation>
            </Box>
            <Annotation>{values[cssVar] || '(unset)'}</Annotation>
          </Flex>
        ))}
      </Stack>
    </div>
  )
}

function CardPropertiesDemo() {
  const [scheme, setScheme] = useState<SchemeKey>('dark')
  const [tone, setTone] = useState<ToneKey>('primary')

  return (
    <Stack gap={4} style={{maxWidth: 720}}>
      <Flex gap={2} wrap="wrap" align="center">
        {SCHEMES.map((s) => (
          <UIButton
            key={s}
            mode={scheme === s ? 'default' : 'ghost'}
            text={s}
            fontSize={1}
            padding={2}
            onClick={() => setScheme(s)}
          />
        ))}
        <Box style={{width: 12}} />
        {TONES.map((t) => (
          <UIButton
            key={t}
            mode={tone === t ? 'default' : 'ghost'}
            text={t}
            fontSize={1}
            padding={2}
            onClick={() => setTone(t)}
          />
        ))}
      </Flex>
      {/* oxlint-disable-next-line no-deprecated -- matches real usage in packages/sanity/src/core/studio/colorScheme.tsx; not yet migrated anywhere in the real Studio source */}
      <ThemeProvider theme={studioTheme} scheme={scheme}>
        <Card tone={tone} border radius={2} padding={4}>
          {/* Remount the probe on every selection so the readout recomputes. */}
          <CardVarReadout key={`${scheme}-${tone}`} />
        </Card>
      </ThemeProvider>
      <Text size={1} muted>
        20 of the 73 custom properties a toned Card emits, the rest are the badge (7 tones × 4
        slots) and avatar (9 hues × 2 slots) families. Values are read with `getComputedStyle` from
        inside the rendered Card, so this is the pipeline’s actual output, not a transcription.
      </Text>
    </Stack>
  )
}

/**
 * The runtime layer, live: pick a scheme and tone, and read the `--card-*` custom
 * properties the Card actually emits: the values every descendant (Text, Code, KBD,
 * Badge) consumes via `var()`. The pipeline itself is taught on the Design System
 * Tooling page.
 */
export const CardProperties: Story = {
  name: 'Card properties (runtime)',
  render: () => <CardPropertiesDemo />,
}

// --- Space -----------------------------------------------------------------------

function SpaceDemo() {
  const [step, setStep] = useState(3)

  return (
    <Stack gap={4} style={{maxWidth: 720}}>
      <Stack gap={2}>
        {THEME_V2.space.map((px, i) => (
          <Flex key={px} align="center" gap={3}>
            <Box style={{width: 110, flexShrink: 0}}>
              <Annotation>{`space[${i}] · ${px}px`}</Annotation>
            </Box>
            <button
              type="button"
              onClick={() => setStep(i)}
              style={{
                border: 'none',
                padding: 0,
                background: step === i ? 'rgba(128,128,128,0.85)' : 'rgba(128,128,128,0.45)',
                width: Math.max(px, 2),
                height: 14,
                borderRadius: 2,
                cursor: 'pointer',
              }}
              aria-label={`Apply space ${i}`}
            />
          </Flex>
        ))}
      </Stack>
      <Card border radius={2} padding={step}>
        <Card tone="primary" padding={2} radius={2}>
          <Text size={1}>{`padding={${step}} → ${THEME_V2.space[step]}px on every side`}</Text>
        </Card>
      </Card>
    </Stack>
  )
}

/**
 * The spacing ladder: the theme.space px scale behind every padding, margin and
 * space prop index. Click a bar to apply it as real Card padding.
 */
export const SpaceScale: Story = {
  name: 'Space',
  render: () => <SpaceDemo />,
}

// --- Radius ----------------------------------------------------------------------

function RadiusDemo() {
  const [step, setStep] = useState(2)

  return (
    <Stack gap={4} style={{maxWidth: 720}}>
      <Flex gap={3} wrap="wrap">
        {THEME_V2.radius.map((px, i) => (
          <Stack key={px} gap={2}>
            <Card
              as="button"
              border
              radius={i}
              padding={4}
              tone={step === i ? 'primary' : 'default'}
              onClick={() => setStep(i)}
              style={{cursor: 'pointer'}}
            >
              <Text size={1}>{`radius={${i}}`}</Text>
            </Card>
            <Annotation>{`${px}px`}</Annotation>
          </Stack>
        ))}
      </Flex>
      <Card border radius={step} padding={4} tone="primary">
        <Text size={1}>{`radius={${step}} → ${THEME_V2.radius[step]}px corner radius`}</Text>
      </Card>
    </Stack>
  )
}

/** The corner-radius scale: `theme.radius`. Click a chip to apply it to the preview. */
export const RadiusScale: Story = {
  name: 'Radius',
  render: () => <RadiusDemo />,
}

// --- Shadows ---------------------------------------------------------------------

function ShadowsDemo() {
  const [level, setLevel] = useState(2)
  const shadow = THEME_V2.shadow[level]

  return (
    <Stack gap={4} style={{maxWidth: 720}}>
      <Flex gap={4} wrap="wrap">
        {THEME_V2.shadow.map((entry, i) => (
          <Card
            key={i === 0 ? 'none' : `u${entry?.umbra.join('-')}`}
            as="button"
            shadow={i}
            radius={2}
            padding={4}
            tone={level === i ? 'primary' : 'default'}
            onClick={() => setLevel(i)}
            style={{cursor: 'pointer'}}
          >
            <Text size={1}>{`shadow={${i}}`}</Text>
          </Card>
        ))}
      </Flex>
      <Card border radius={2} padding={4}>
        <Stack gap={3}>
          <Label size={1}>{`shadow={${level}}`}</Label>
          {shadow ? (
            <Stack gap={2}>
              <Annotation>{`umbra    [${shadow.umbra.join(', ')}]`}</Annotation>
              <Annotation>{`penumbra [${shadow.penumbra.join(', ')}]`}</Annotation>
              <Annotation>{`ambient  [${shadow.ambient.join(', ')}]`}</Annotation>
            </Stack>
          ) : (
            <Text size={1} muted>
              Level 0 renders no shadow.
            </Text>
          )}
          <Text size={1} muted>
            Each level is three stacked box-shadows (umbra / penumbra / ambient as x, y, blur,
            spread). Their colors are tone tokens, `base.shadow` in the theme, so elevation follows
            the scheme.
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}

/** The elevation scale: `theme.shadows`, six levels of layered umbra/penumbra/ambient. */
export const Shadows: Story = {
  render: () => <ShadowsDemo />,
}

// --- Container -------------------------------------------------------------------

// The Dialog width study's proposed renumbering (RFC) — see Overlays & Navigation/Dialog.
const CONTAINER_RFC = [320, 480, 640, 800, 1024, 1280]
const BODY_FONT_PX = 13
const AVG_CHAR_EM = 0.49

function ContainerDemo() {
  const [preset, setPreset] = useState(1)
  const max = THEME_V2.container[THEME_V2.container.length - 1]

  return (
    <Stack gap={4} style={{maxWidth: 760}}>
      <Stack gap={2}>
        {THEME_V2.container.map((px, i) => (
          <Flex key={px} align="center" gap={3}>
            <Box style={{width: 130, flexShrink: 0}}>
              <Annotation>{`container[${i}] · ${px}px`}</Annotation>
            </Box>
            <Box flex={1}>
              <button
                type="button"
                onClick={() => setPreset(i)}
                aria-label={`Inspect container ${i}`}
                style={{
                  display: 'block',
                  border: 'none',
                  padding: 0,
                  width: `${(px / max) * 100}%`,
                  height: 14,
                  borderRadius: 2,
                  background: preset === i ? 'rgba(128,128,128,0.85)' : 'rgba(128,128,128,0.45)',
                  cursor: 'pointer',
                }}
              />
            </Box>
          </Flex>
        ))}
      </Stack>
      <Card border radius={2} padding={4}>
        <Stack gap={3}>
          <Label size={1}>{`width={${preset}}`}</Label>
          <Annotation>
            {`${THEME_V2.container[preset]}px · ~${Math.round(
              THEME_V2.container[preset] / (BODY_FONT_PX * AVG_CHAR_EM),
            )}ch at 13px · RFC proposes ${CONTAINER_RFC[preset]}px`}
          </Annotation>
          <Text size={1} muted>
            These are the very tokens the width study proposes renumbering: the current scale jumps
            320 → 640 with nothing near the ~60–70ch text sweet-spot. The full preset and RFC
            tables, with the measure argument, live on the Dialog page.
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}

/**
 * `theme.container`: the widths behind every `width` preset on Dialog, Container and
 * friends, drawn to scale. Click a bar for its measure at body size and the width
 * study’s proposed RFC value.
 */
export const ContainerWidths: Story = {
  name: 'Container',
  render: () => <ContainerDemo />,
}

// --- Layer -----------------------------------------------------------------------

const LAYERS = (['tooltip', 'popover', 'dialog'] as const)
  // oxlint-disable-next-line no-deprecated -- matches real usage in packages/sanity/src/core/studio/colorScheme.tsx; not yet migrated anywhere in the real Studio source
  .map((name) => ({name, zOffset: studioTheme.v2!.layer[name].zOffset}))
  .sort((a, b) => a.zOffset - b.zOffset)

function LayerDemo() {
  const [raised, setRaised] = useState('dialog')

  return (
    <Stack gap={4} style={{maxWidth: 720}}>
      <Flex gap={2}>
        {LAYERS.map((layer) => (
          <UIButton
            key={layer.name}
            mode={raised === layer.name ? 'default' : 'ghost'}
            text={`${layer.name} · ${layer.zOffset}`}
            fontSize={1}
            padding={2}
            onClick={() => setRaised(layer.name)}
          />
        ))}
      </Flex>
      <Box style={{position: 'relative', height: 190}}>
        {LAYERS.map((layer, i) => (
          <Card
            key={layer.name}
            border
            radius={2}
            padding={3}
            shadow={2}
            style={{
              position: 'absolute',
              top: i * 44,
              left: i * 56,
              width: 280,
              zIndex: raised === layer.name ? 1000 : layer.zOffset,
            }}
          >
            <Flex justify="space-between" align="center">
              <Text size={1} weight={raised === layer.name ? 'semibold' : undefined}>
                {layer.name}
              </Text>
              <Annotation>{`zOffset ${layer.zOffset}`}</Annotation>
            </Flex>
          </Card>
        ))}
      </Box>
      <Text size={1} muted>
        The theme carries three named z-offsets; actual stacking is contextual, each `Layer` adds
        its offset to its parent via `useLayer()`, so a tooltip inside a dialog still clears it.
        Click a chip to raise that layer.
      </Text>
    </Stack>
  )
}

/**
 * `theme.layer` z-offsets: tooltip 200, popover 400, dialog 600, plus the rule that
 * matters more than the numbers: offsets compose through the `Layer` context, they are
 * not absolute z-indexes.
 */
export const LayerOffsets: Story = {
  name: 'Layer',
  render: () => <LayerDemo />,
}

// --- Breakpoints -----------------------------------------------------------------

function BreakpointsDemo() {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  const max = THEME_V2.media[THEME_V2.media.length - 1]

  useEffect(() => {
    const el = trackRef.current
    if (!el) return undefined
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const active = THEME_V2.media.filter((bp) => bp <= width).length

  return (
    <Stack gap={4}>
      <div ref={trackRef} style={{position: 'relative', height: 44}}>
        <div
          style={{
            position: 'absolute',
            inset: '14px 0',
            background: 'rgba(128,128,128,0.2)',
            borderRadius: 3,
          }}
        />
        {THEME_V2.media.map((bp, i) => {
          // The last breakpoint's tick sits at `left: 100%` (bp === max), so a label anchored
          // `left: 3` off that line starts at the track's own right edge and runs past it -
          // measured width-invariant (61px over at both 998px and 1280px canvases, not a
          // proportional preview-beyond-canvas effect, which the OTHER ticks' inactive-opacity
          // beyond-width states are and which stays untouched). Anchoring this one label with
          // `right` instead of `left` reads it to the left of its own line, inside the canvas,
          // without changing where the line itself sits or how any other label is positioned.
          const isLastBreakpoint = i === THEME_V2.media.length - 1
          return (
            <div
              key={bp}
              style={{
                position: 'absolute',
                left: `${Math.min((bp / max) * 100, 100)}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: bp <= width ? 'rgba(128,128,128,0.9)' : 'rgba(128,128,128,0.4)',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  ...(isLastBreakpoint ? {right: 3} : {left: 3}),
                  fontSize: 10,
                  fontFamily: 'monospace',
                  opacity: bp <= width ? 1 : 0.5,
                  whiteSpace: 'nowrap',
                }}
              >
                {`media[${i}] ${bp}`}
              </span>
            </div>
          )
        })}
        {/* The live cursor: this story's own canvas width on the same scale. */}
        <div
          style={{
            position: 'absolute',
            left: `${Math.min((width / max) * 100, 100)}%`,
            top: 8,
            bottom: 8,
            width: 3,
            background: 'rgba(70,140,255,0.9)',
            borderRadius: 2,
          }}
        />
      </div>
      <Text size={1}>
        {`This canvas is ${Math.round(width)}px wide, ${active} of ${THEME_V2.media.length} breakpoints active. Resize the panel and watch the cursor move.`}
      </Text>
      <Text size={1} muted>
        `theme.media` drives every responsive array prop (`padding={'{[3, 4, 5]}'}` steps up at each
        breakpoint) and the `useMediaIndex()` hook.
      </Text>
    </Stack>
  )
}

/**
 * `theme.media`: the responsive breakpoints, drawn to scale with a live cursor
 * tracking this very canvas’s width. Resize the panel to cross them.
 */
export const Breakpoints: Story = {
  render: () => <BreakpointsDemo />,
}

// --- Avatar sizes ----------------------------------------------------------------

function AvatarSizesDemo() {
  const [initials, setInitials] = useState('FH')

  return (
    <Stack gap={4} style={{maxWidth: 720}}>
      <Box style={{maxWidth: 220}}>
        <TextInput
          value={initials}
          onChange={(event) => setInitials(event.currentTarget.value.slice(0, 2))}
          placeholder="Initials"
        />
      </Box>
      <Flex gap={5} align="flex-end" wrap="wrap">
        {THEME_V2.avatar.sizes.map((size, i) => (
          <Stack key={size.size} gap={3}>
            <Avatar initials={initials || 'FH'} size={i as AvatarSize} color="blue" />
            <Annotation>{`size ${i} · ${size.size}px · stack ${size.distance}`}</Annotation>
          </Stack>
        ))}
      </Flex>
      <Text size={1} muted>
        `distance` is the negative overlap an `AvatarStack` applies between neighbours at that size;
        the focus ring adds {THEME_V2.avatar.focusRing.width}px at offset{' '}
        {THEME_V2.avatar.focusRing.offset}.
      </Text>
    </Stack>
  )
}

/** `theme.avatar.sizes`: the four avatar diameters with their stack distances, rendered live. */
export const AvatarSizes: Story = {
  name: 'Avatar sizes',
  render: () => <AvatarSizesDemo />,
}

// --- Type tokens -----------------------------------------------------------------

const FONT_FAMILIES = ['text', 'heading', 'code', 'label'] as const
type FontFamilyKey = (typeof FONT_FAMILIES)[number]

function TypeTokensDemo() {
  const [family, setFamily] = useState<FontFamilyKey>('text')
  const font = THEME_V2.font[family]

  return (
    <Stack gap={4} style={{maxWidth: 760}}>
      <Flex gap={2}>
        {FONT_FAMILIES.map((f) => (
          <UIButton
            key={f}
            mode={family === f ? 'default' : 'ghost'}
            text={f}
            fontSize={1}
            padding={2}
            onClick={() => setFamily(f)}
          />
        ))}
      </Flex>
      <Card border radius={2} padding={4}>
        <Stack gap={3}>
          <Annotation>{`family: ${font.family}`}</Annotation>
          <Annotation>
            {`weights: ${Object.entries(font.weights)
              .map(([name, value]) => `${name} ${value}`)
              .join(' · ')}`}
          </Annotation>
          <Stack gap={2}>
            {font.sizes.map((size, i) => (
              <Flex key={size.fontSize} gap={3} align="center" wrap="wrap">
                <Box style={{width: 60, flexShrink: 0}}>
                  <Annotation>{`size ${i}`}</Annotation>
                </Box>
                <Annotation>
                  {`font ${size.fontSize}px · line ${size.lineHeight}px · icon ${size.iconSize}px · asc ${size.ascenderHeight} · desc ${size.descenderHeight}${size.letterSpacing ? ` · tracking ${size.letterSpacing}px` : ''}`}
                </Annotation>
              </Flex>
            ))}
          </Stack>
        </Stack>
      </Card>
      <Text size={1} muted>
        Raw values only, the rendered specimens, the size floor and the measure principle live on
        `Foundations/Typography`. `iconSize` is why icons sit optically centered beside text at
        every step; `ascender`/`descender` trim the line box for precise vertical rhythm.
      </Text>
    </Stack>
  )
}

/**
 * `theme.fonts` raw values: sizes, line heights, icon sizes, ascender/descender trims
 * and weights for all four families. Specimens and principles: `Foundations/Typography`.
 */
export const TypeTokens: Story = {
  name: 'Type tokens',
  render: () => <TypeTokensDemo />,
}
