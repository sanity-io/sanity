import {
  Box,
  Button as UIButton,
  Card,
  Code,
  Flex,
  Heading,
  Hotkeys,
  Label,
  Stack,
  Text,
  TextInput,
  useRootTheme,
  useTheme_v2 as useThemeV2,
} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useEffect, useRef, useState} from 'react'

// Real components from their real paths (org contract §8): the Studio tooltip
// (content at size 1, hotkeys via @sanity/ui KBD at its size-0 default) and the
// calendar day cell whose disabled state is the contrast cautionary specimen.
import {CalendarDay} from '../../../../packages/sanity/src/core/components/inputs/DateInputs/calendar/CalendarDay'
import {Tooltip} from '../../../../packages/sanity/src/ui-components/tooltip/Tooltip'

const meta: Meta = {
  title: 'Foundations/Typography',
  parameters: {
    docs: {
      description: {
        component: [
          'Small-text legibility complaints spanned four surfaces in the captain’s review, and this page is the reference behind the fix: the real type scale, the measure band, the size floor, and the contrast baselines, every number read live from the theme.',
          '',
          '| | |',
          '|---|---|',
          '| Source | catalog foundations; every number on this page is read live from the `@sanity/ui` theme (`useTheme_v2()` / `buildTheme()`), nothing is hardcoded, so if the theme moves, this page moves with it |',
          '| Tier | n/a, foundations ground floor. This is the reference the component pages lean on: the real type scale, the measure band, the size floor, and the contrast baselines |',
          '| Audit | 🔴 needs-work (night-shift charter law 8); small-text legibility complaints in the captain’s review spanned four surfaces: tooltip hotkeys (`@sanity/ui` KBD defaults to size 0 = 10px inside a 13px tooltip), relative timestamps (comments render `<Text muted size={0}>`, 10px *and* muted), progress labels (floor-size but muted over thin tracks), and Vision errors (13px mono explaining results rendered at 16px). The contrast story adds the calendar’s disabled-day finding (≈1.3:1, functionally invisible, see the `CMS Patterns/Schedule Form` docblock) |',
          '',
          'Studio sets type in **Inter** for text and headings and the OS mono stack for code, ' +
            'on a five-step text scale (10 / 13 / 15 / 18 / 21px) with headings running 13 → ' +
            '38px. The scale is small on purpose: an editing surface wants one calm reading ' +
            'size (13px, `size={1}`, the body floor) with steps reserved for real shifts in ' +
            'hierarchy, not decoration. This page is the *principles* half; the raw token ' +
            'tables (icon sizes, ascender/descender trims, weights, families) live on ' +
            '`Foundations/Design Tokens` → Type tokens. Each story below argues one of the ' +
            'four findings on its own page: the size floor, the measure band, and the ' +
            'contrast baselines.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:systems', 'pattern:design-tokens', 'pattern:readable-measure'],
}

export default meta
type Story = StoryObj

// --- Shared instrumentation ------------------------------------------------------
// WCAG 2.1 relative luminance + contrast ratio, computed from theme hexes at render
// time so the numbers can never drift from what the swatch actually shows.

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

/** Quiet monospace annotation — instrumentation, so 10px is allowed (and never muted). */
function Annotation({children}: {children: React.ReactNode}) {
  return (
    <Code size={0} style={{whiteSpace: 'nowrap'}}>
      {children}
    </Code>
  )
}

// --- Type scale ------------------------------------------------------------------

const DEFAULT_SPECIMEN = 'Content is data with a deadline'

function ScaleSection({
  label,
  note,
  children,
}: {
  label: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <Stack gap={3}>
      <Flex align="baseline" gap={3}>
        <Label size={1}>{label}</Label>
        {note && (
          <Text size={1} muted>
            {note}
          </Text>
        )}
      </Flex>
      <Card border radius={2} padding={4}>
        <Stack gap={4}>{children}</Stack>
      </Card>
    </Stack>
  )
}

function ScaleRow({
  annotation,
  flag,
  children,
}: {
  annotation: string
  flag?: string
  children: React.ReactNode
}) {
  return (
    <Flex align="center" gap={4}>
      <Box style={{width: 148, flexShrink: 0}}>
        <Stack gap={2}>
          <Annotation>{annotation}</Annotation>
          {flag && (
            <Text size={1} muted>
              {flag}
            </Text>
          )}
        </Stack>
      </Box>
      <Box flex={1} style={{minWidth: 0}}>
        {children}
      </Box>
    </Flex>
  )
}

const flagFor = (px: number) =>
  px < 13 ? 'below the floor, instrumentation only' : px === 13 ? 'the body floor' : undefined

function TypeScaleDemo() {
  const {font} = useThemeV2()
  const [specimen, setSpecimen] = useState(DEFAULT_SPECIMEN)
  const text = specimen || DEFAULT_SPECIMEN

  return (
    <Stack gap={5} style={{maxWidth: 760}}>
      <Flex align="center" gap={3}>
        <Box flex={1}>
          <TextInput
            value={specimen}
            onChange={(event) => setSpecimen(event.currentTarget.value)}
            placeholder={DEFAULT_SPECIMEN}
          />
        </Box>
        <UIButton
          mode="ghost"
          text="Reset"
          disabled={specimen === DEFAULT_SPECIMEN}
          onClick={() => setSpecimen(DEFAULT_SPECIMEN)}
        />
      </Flex>

      <ScaleSection label="Text" note="Inter · weights 400 / 500 / 600 / 700">
        {font.text.sizes.map((size, i) => (
          <ScaleRow
            key={size.fontSize}
            annotation={`size ${i} · ${size.fontSize}px / ${size.lineHeight}px`}
            flag={flagFor(size.fontSize)}
          >
            <Text size={i}>{text}</Text>
          </ScaleRow>
        ))}
      </ScaleSection>

      <ScaleSection label="Heading" note="Inter · regular maps to weight 700">
        {font.heading.sizes.map((size, i) => (
          <ScaleRow
            key={size.fontSize}
            annotation={`size ${i} · ${size.fontSize}px / ${size.lineHeight}px`}
          >
            <Heading size={i}>{text}</Heading>
          </ScaleRow>
        ))}
      </ScaleSection>

      <ScaleSection label="Code" note="OS mono stack, no webfont">
        {font.code.sizes.map((size, i) => (
          <ScaleRow
            key={size.fontSize}
            annotation={`size ${i} · ${size.fontSize}px / ${size.lineHeight}px`}
            flag={flagFor(size.fontSize)}
          >
            {/*
              No `overflow: hidden` here. StyledCode sets an explicit height equal to the trimmed
              cap band (lineHeight minus ascender minus descender) and paints its glyphs outside
              that box, so clipping the element slices every specimen through the middle. Measured
              on the 2026-07-27 build: a 22px/31px specimen sits in a 13px box and lost 18px.
            */}
            <Code size={i} style={{whiteSpace: 'nowrap'}}>
              {text}
            </Code>
          </ScaleRow>
        ))}
      </ScaleSection>

      <ScaleSection label="Label" note="uppercase micro-type · 0.5px tracking">
        {font.label.sizes.map((size, i) => (
          <ScaleRow
            key={size.fontSize}
            annotation={`size ${i} · ${size.fontSize}px / ${size.lineHeight}px`}
          >
            <Label size={i}>{text}</Label>
          </ScaleRow>
        ))}
      </ScaleSection>
    </Stack>
  )
}

/**
 * The real scale, read from the live theme at render time: sizes, line heights and
 * families are whatever `useTheme_v2()` reports, never a transcription. Type your own
 * specimen to see how each step carries it; the annotations flag 10px as
 * instrumentation-only and 13px as the body floor.
 */
export const TypeScale: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'The five-step text scale (10 / 13 / 15 / 18 / 21px) and the heading scale (13 → 38px), ' +
            'read live from the theme. 13px (`size={1}`) is the body floor: the calm reading size the ' +
            'rest of the interface is built around, with steps reserved for real shifts in hierarchy ' +
            'rather than decoration.',
        ].join('\n'),
      },
    },
  },
  name: 'Type scale',
  render: () => <TypeScaleDemo />,
}

// --- Measure ---------------------------------------------------------------------
// Same constants as the Dialog width study (Overlays & Navigation/Dialog) so the two
// rulers always agree: 13px Inter, average glyph advance ≈ 0.49em, 45–75ch band.

const BODY_FONT_PX = 13
const AVG_CHAR_EM = 0.49
const BAND_MIN_CH = 45
const BAND_MAX_CH = 75
const RULER_MAX_CH = 120
const MEASURE_PRESETS = [240, 320, 396, 480, 600, 760]

const MEASURE_PROSE =
  'A comfortable measure keeps the eye’s return sweep short: each new line starts close ' +
  'to where the reader expects it, so reading stays automatic. Stretch the column past ' +
  'seventy-five characters and the sweep lengthens, the line is easier to lose, and ' +
  'reading measurably slows, the text is identical, only the width has changed.'

function measureCh(contentPx: number): number {
  return contentPx / (BODY_FONT_PX * AVG_CHAR_EM)
}

/** The grayscale measure ruler — same device as the Dialog width study. */
function MeasureRuler({contentPx}: {contentPx: number}) {
  const ch = measureCh(contentPx)
  const over = ch > BAND_MAX_CH
  const under = ch < BAND_MIN_CH
  const pct = (v: number) => Math.min(100, (v / RULER_MAX_CH) * 100)

  return (
    <Stack gap={2}>
      <Flex justify="space-between" align="flex-end">
        <Text size={0} muted>
          Text column measure
        </Text>
        <Text size={0} muted weight={over || under ? 'semibold' : undefined}>
          {`~${Math.round(ch)}ch · ${Math.round(contentPx)}px${
            over ? ', over 75ch' : under ? ', under 45ch' : ', in band'
          }`}
        </Text>
      </Flex>
      <Box
        style={{
          position: 'relative',
          height: 18,
          border: '1px solid rgba(128,128,128,0.4)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pct(BAND_MIN_CH)}%`,
            width: `${pct(BAND_MAX_CH) - pct(BAND_MIN_CH)}%`,
            background: 'rgba(128,128,128,0.16)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: `${pct(Math.min(ch, BAND_MAX_CH))}%`,
            background: 'rgba(128,128,128,0.45)',
          }}
        />
        {over && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${pct(BAND_MAX_CH)}%`,
              width: `${pct(ch) - pct(BAND_MAX_CH)}%`,
              background:
                'repeating-linear-gradient(45deg, rgba(128,128,128,0.75) 0 4px, transparent 4px 8px)',
            }}
          />
        )}
        {[BAND_MIN_CH, BAND_MAX_CH].map((tick) => (
          <div
            key={tick}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${pct(tick)}%`,
              width: 1,
              background: 'rgba(128,128,128,0.65)',
            }}
          />
        ))}
      </Box>
      <Box style={{position: 'relative', height: 14}}>
        <Text size={0} muted style={{position: 'absolute', left: 0}}>
          0
        </Text>
        <Text size={0} muted style={{position: 'absolute', left: `${pct(BAND_MIN_CH)}%`}}>
          45ch
        </Text>
        <Text size={0} muted style={{position: 'absolute', left: `${pct(BAND_MAX_CH)}%`}}>
          75ch
        </Text>
        <Text size={0} muted style={{position: 'absolute', right: 0}}>
          {`${RULER_MAX_CH}ch`}
        </Text>
      </Box>
    </Stack>
  )
}

function MeasureDemo() {
  const [width, setWidth] = useState(600)
  const [measured, setMeasured] = useState(600)
  const columnRef = useRef<HTMLDivElement | null>(null)

  // The column is user-resizable (drag its bottom-right handle); the observer keeps
  // the ruler honest whichever way the width changed.
  useEffect(() => {
    const el = columnRef.current
    if (!el) return undefined
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setMeasured(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Stack gap={4} style={{maxWidth: 860}}>
      <Flex gap={2} wrap="wrap" align="center">
        <Text size={1} muted>
          Column width:
        </Text>
        {MEASURE_PRESETS.map((preset) => (
          <UIButton
            key={preset}
            mode={width === preset ? 'default' : 'ghost'}
            text={`${preset}px`}
            fontSize={1}
            padding={2}
            onClick={() => setWidth(preset)}
          />
        ))}
        <Text size={1} muted>
          or drag the column’s corner handle
        </Text>
      </Flex>

      <div
        ref={columnRef}
        style={{
          width,
          minWidth: 160,
          maxWidth: '100%',
          resize: 'horizontal',
          overflow: 'auto',
          border: '1px dashed rgba(128,128,128,0.5)',
          borderRadius: 4,
          padding: 12,
        }}
      >
        <Text size={1}>{MEASURE_PROSE}</Text>
      </div>

      <MeasureRuler contentPx={measured} />
    </Stack>
  )
}

/**
 * The 45–75ch band, live. Set the column with a preset or drag its resize handle: the
 * ruler tracks the real rendered width and shows the measure entering and leaving the
 * comfort band. 396px is the ~62ch cap the Dialog width study recommends for
 * text-first dialog bodies; 600px is what `width={1}` confirm dialogs actually give
 * their copy today (~94ch, in the hatched over-zone).
 */
export const Measure: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'Prose reads comfortably at 45–75 characters per line; past ~75ch the eye’s return sweep ' +
            'measurably slows. At 13px Inter a character averages ≈6.4px, so the comfort band is ' +
            'roughly 290–480px of text column. Drag the column or use the presets and watch it enter ' +
            'and leave the band. The full width study (preset table + proposed RFC scale) lives on ' +
            '`Overlays & Navigation/Dialog`.',
        ].join('\n'),
      },
    },
  },
  render: () => <MeasureDemo />,
}

// --- The size floor --------------------------------------------------------------

function FloorSpecimen({
  title,
  citation,
  shipped,
  floor,
  shippedLabel,
  floorLabel,
  children,
}: {
  title: string
  citation: string
  shipped: React.ReactNode
  floor: React.ReactNode
  shippedLabel: string
  floorLabel: string
  children?: React.ReactNode
}) {
  return (
    <Card border radius={2} padding={4}>
      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={1} weight="semibold">
            {title}
          </Text>
          <Annotation>{citation}</Annotation>
        </Stack>
        <Flex gap={4} wrap="wrap">
          <Box flex={1} style={{minWidth: 240}}>
            <Stack gap={3}>
              <Label size={0} muted>
                {shippedLabel}
              </Label>
              <Card tone="critical" border radius={2} padding={3}>
                {shipped}
              </Card>
            </Stack>
          </Box>
          <Box flex={1} style={{minWidth: 240}}>
            <Stack gap={3}>
              <Label size={0} muted>
                {floorLabel}
              </Label>
              <Card tone="positive" border radius={2} padding={3}>
                {floor}
              </Card>
            </Stack>
          </Box>
        </Flex>
        {children}
      </Stack>
    </Card>
  )
}

const GROQ_ERROR_SNIPPET = '*[_type == "post" && publishedAt > now()]{title,\n  ^ expected "}"'

function SizeFloorDemo() {
  return (
    <Stack gap={4} style={{maxWidth: 860}}>
      <FloorSpecimen
        title="Tooltip hotkeys"
        citation="ui-components/tooltip/Tooltip.tsx: content size 1 (13px), Hotkeys → KBD default fontSize 0 (10px)"
        shippedLabel="As shipped · KBD at 10px"
        floorLabel="At the floor · KBD at 13px"
        shipped={
          <Flex align="center" gap={3}>
            <Text size={1}>Publish</Text>
            <Hotkeys keys={['Ctrl', 'Alt', 'P']} />
          </Flex>
        }
        floor={
          <Flex align="center" gap={3}>
            <Text size={1}>Publish</Text>
            <Hotkeys keys={['Ctrl', 'Alt', 'P']} fontSize={1} />
          </Flex>
        }
      >
        <Flex align="center" gap={3}>
          <Tooltip content="Publish" hotkeys={['Ctrl', 'Alt', 'P']}>
            <UIButton mode="ghost" text="Hover me, the real Studio tooltip" fontSize={1} />
          </Tooltip>
          <Text size={1} muted>
            The keys a user came to learn are the smallest thing in the tooltip.
          </Text>
        </Flex>
      </FloorSpecimen>

      <FloorSpecimen
        title="Relative time"
        citation="core/comments/…/CommentsListItemLayout.tsx:361: <Text muted size={0}>, 10px AND muted"
        shippedLabel="As shipped · 10px muted"
        floorLabel="At the floor · 13px muted"
        shipped={
          <Text size={0} muted>
            2 hours ago (edited)
          </Text>
        }
        floor={
          <Text size={1} muted>
            2 hours ago (edited)
          </Text>
        }
      >
        <Text size={1} muted>
          Two penalties stack: the smallest size and reduced contrast. Timestamps decide
          {' “is this stale?” '}, they are read, not decoration.
        </Text>
      </FloorSpecimen>

      <FloorSpecimen
        title="Progress labels"
        citation="releases/tool/detail/ValidationProgressIndicator.tsx:98: <Text muted size={1}> over a thin track"
        shippedLabel="As shipped · 13px muted"
        floorLabel="At the floor · 13px, full contrast"
        shipped={
          <Stack gap={3}>
            <Text size={1} muted>
              Validating documents… 3/12
            </Text>
            <div style={{height: 2, borderRadius: 1, background: 'rgba(128,128,128,0.35)'}}>
              <div
                style={{
                  height: 2,
                  width: '25%',
                  borderRadius: 1,
                  background: 'rgba(128,128,128,0.9)',
                }}
              />
            </div>
          </Stack>
        }
        floor={
          <Stack gap={3}>
            <Text size={1}>Validating documents… 3/12</Text>
            <div style={{height: 4, borderRadius: 2, background: 'rgba(128,128,128,0.35)'}}>
              <div
                style={{
                  height: 4,
                  width: '25%',
                  borderRadius: 2,
                  background: 'rgba(128,128,128,0.9)',
                }}
              />
            </div>
          </Stack>
        }
      >
        <Text size={1} muted>
          At the floor size the failure axis is contrast: a muted label over a hairline track reads
          as chrome, not as the status it is.
        </Text>
      </FloorSpecimen>

      <FloorSpecimen
        title="Vision errors"
        citation="@sanity/vision QueryErrorDialog.tsx:9: ErrorCode size 1 (13px mono); results render at font.code.sizes[2] (16px, ResultView.tsx:30)"
        shippedLabel="As shipped · error at 13px mono"
        floorLabel="Level with results · 16px mono"
        // `pre-wrap`, not `pre`: the snippet's first line is 47 characters, which fits the column
        // at 13px mono and overflows it at 16px. Both specimens carry the same value so the only
        // difference between them stays the size, which is the whole proof device.
        //
        // Not `overflow: auto` on the Code. StyledCode's box is the trimmed cap band and its
        // glyphs paint outside it, so any overflow value other than visible slices them
        // horizontally through the middle.
        shipped={
          <Code size={1} style={{whiteSpace: 'pre-wrap'}}>
            {GROQ_ERROR_SNIPPET}
          </Code>
        }
        floor={
          <Code size={2} style={{whiteSpace: 'pre-wrap'}}>
            {GROQ_ERROR_SNIPPET}
          </Code>
        }
      >
        <Text size={1} muted>
          The error that explains a failed query renders two mono steps below the results it
          replaces, the moment of confusion gets the smallest type on the page.
        </Text>
      </FloorSpecimen>
    </Stack>
  )
}

/**
 * Law 8’s evidence, rendered. The four small-text findings from the captain’s review,
 * each reproduced at its shipped size beside the floor-size fix: the comparison is the
 * proof device. The floor is two-dimensional: 13px for anything a user must read, and
 * never `muted` at 10px.
 */
export const SizeFloor: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'Sizes are principled, not habits. The floor for anything a user must read is 13px ' +
            '(`size={1}`). 10px (`size={0}`) is instrumentation, counts, ticks, axis labels, and even ' +
            'there it must never also be `muted`: the floor is two-dimensional, px × contrast. Each ' +
            'finding below renders too-small-as-shipped beside its floor-size fix; the comparison is ' +
            'the argument.',
        ].join('\n'),
      },
    },
  },
  name: 'The size floor',
  tags: ['audit:needs-work'],
  render: () => <SizeFloorDemo />,
}

// --- Contrast baselines ----------------------------------------------------------

const CONTRAST_TONES = ['default', 'primary', 'positive', 'caution', 'critical'] as const

function RatioChip({ratio, large}: {ratio: number; large?: boolean}) {
  const threshold = large ? 3 : 4.5
  const pass = ratio >= threshold
  return (
    <Card tone={pass ? 'positive' : 'critical'} border radius={2} paddingX={2} paddingY={1}>
      <Text size={0}>{`${ratio.toFixed(2)}:1 ${pass ? '≥' : '<'} ${threshold}:1`}</Text>
    </Card>
  )
}

function ContrastDemo() {
  const root = useRootTheme()
  const scheme = root.scheme === 'dark' ? 'dark' : 'light'
  // oxlint-disable-next-line no-deprecated -- v2 color namespace not yet adopted anywhere in packages/sanity/src; v1 remains fully functional pending a real migration
  const themeColor = buildTheme().color[scheme]

  const today = new Date()
  const dayAt = (offset: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    return d
  }
  const disabledDay = themeColor.default.card.disabled
  const disabledRatio = contrastRatio(disabledDay.fg, themeColor.default.base.bg)

  return (
    <Stack gap={5} style={{maxWidth: 860}}>
      <Stack gap={3}>
        <Label size={1}>{`Tone baselines, ${scheme} scheme (follows the toolbar toggle)`}</Label>
        <Stack gap={2}>
          {CONTRAST_TONES.map((tone) => {
            const base = themeColor[tone].base
            const mutedFg = themeColor[tone].card.enabled.muted.fg
            return (
              <Card key={tone} tone={tone} border radius={2} padding={3}>
                <Flex align="center" gap={4} wrap="wrap">
                  <Box style={{width: 90}}>
                    <Text size={1} weight="semibold">
                      {tone}
                    </Text>
                  </Box>
                  <Flex align="center" gap={2}>
                    <Text size={1}>fg</Text>
                    <Annotation>{`${base.fg} on ${base.bg}`}</Annotation>
                    <RatioChip ratio={contrastRatio(base.fg, base.bg)} />
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Text size={1} muted>
                      muted
                    </Text>
                    <Annotation>{mutedFg}</Annotation>
                    <RatioChip ratio={contrastRatio(mutedFg, base.bg)} />
                  </Flex>
                </Flex>
              </Card>
            )
          })}
        </Stack>
        <Text size={1} muted>
          Chips test WCAG AA for normal text (4.5:1), computed from the same theme hexes the
          swatches render with.
        </Text>
      </Stack>

      <Stack gap={3}>
        <Label size={1}>The cautionary specimen, disabled calendar days</Label>
        <Card border radius={2} padding={4}>
          <Stack gap={4}>
            <Flex gap={1}>
              {[-4, -3, -2, -1, 0, 1, 2].map((offset) => (
                <CalendarDay
                  key={offset}
                  date={dayAt(offset)}
                  isCurrentMonth
                  isToday={offset === 0}
                  isPastDisabled
                  onSelect={() => {}}
                />
              ))}
            </Flex>
            <Flex align="center" gap={2} wrap="wrap">
              <Text size={1}>disabled day number</Text>
              <Annotation>{`${disabledDay.fg} on ${themeColor.default.base.bg}`}</Annotation>
              <RatioChip ratio={disabledRatio} />
            </Flex>
            <Text size={1} muted>
              The real `CalendarDay`, past days disabled. The disabled-card tokens land at
              {` ≈${disabledRatio.toFixed(2)}:1 `}in this scheme, below every WCAG threshold, and in
              dark mode the day grid was twice misread as broken in QA (see the Schedule Form
              docblock’s ledger note). Disabled must still be findable: the state may mute, but the
              glyph has to survive.
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Stack>
  )
}

/**
 * Every tone’s fg/bg and muted/bg pair with its computed WCAG ratio, live from the
 * theme, following the light/dark toggle, and the cautionary specimen: the real
 * calendar day cell whose disabled state (≈1.3:1) is what shipping a color decision
 * without a contrast baseline looks like.
 */
export const ContrastBaselines: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'Body text on the base surface sits near 14.6:1 in both schemes; muted text near 5:1 ' +
            '(light) / 6:1 (dark), above the 4.5:1 AA bar for normal text. `muted` at 13px holds but ' +
            '`muted` at 10px does not, since smaller glyphs need more contrast, not less. Every tone’s ' +
            'ratio is computed live below, closing with the cautionary specimen: the real ' +
            '`CalendarDay`, whose disabled state inherits the theme’s disabled-card tokens at ≈1.3:1, ' +
            'below every threshold, effectively invisible in dark mode.',
        ].join('\n'),
      },
    },
  },
  name: 'Contrast baselines',
  tags: ['audit:needs-work'],
  render: () => <ContrastDemo />,
}
