import {icons} from '@sanity/icons'
import {
  Box,
  Button as UIButton,
  Card,
  Code,
  Flex,
  LayerProvider,
  Popover,
  Stack,
  studioTheme,
  Tab,
  TabList,
  TabPanel,
  Text,
  TextInput,
  ThemeProvider,
  useRootTheme,
} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ComponentType, useLayoutEffect, useRef, useState} from 'react'

import {categorizeIcons} from './iconCategories'

const meta: Meta = {
  title: 'Foundations/Design System Tooling',
  parameters: {
    docs: {
      description: {
        component: [
          'This page explains how the design system actually works, not what the tokens are, ' +
            'and several of this program’s findings trace straight back to these mechanisms: ' +
            'portal theming, native `color-scheme` emission, and the icon packaging split.',
          '',
          '| | |',
          '|---|---|',
          '| Source | catalog foundations; mechanisms demonstrated on the real `@sanity/ui` runtime, the palette/theme/property layers it explains are cataloged on `Foundations/Design Tokens` and `Foundations/Theme Matrix` |',
          '| Tier | n/a, foundations ground floor: not *what* the tokens are, but **how the design system is built and consumed**. Several of this program’s findings hinged on exactly these mechanisms; where they do, the story links to the evidence |',
          '| Audit | ⚪ not-audited as a unit; this page is the technical backdrop for findings that are: portal theming (the contract’s §5 gotcha, verified on `Overlays & Navigation/Dialog` in dark mode), `color-scheme` emission vs owning the controls (`Forms & Input/DateInputs`), container tokens (the Dialog width-study RFC), and the icon packaging note (findings ledger #12) |',
          '',
          '### How a theme is built',
          '',
          'Three functions make the stack. `@sanity/color` supplies the inert palette (9 hues × ' +
            '11 tints). `buildTheme(config?)`, from `@sanity/ui/theme`, resolves it into every ' +
            'semantic slot: five tones × two schemes × interaction states, plus space, radius, ' +
            'shadows, containers, layers and breakpoints. A custom theme is `buildTheme({...})` ' +
            'with token-level overrides (hue/tint token strings, not hexes), or ' +
            '`createColorTheme()` for a fully custom color resolution; `getContrastRatio()` ships ' +
            'alongside them in the same entry. Studio itself just calls `buildTheme()`: ' +
            '`packages/sanity/src/core/theme/index.ts` exposes it behind a deprecated lazy ' +
            '`defaultTheme` proxy, and the legacy `buildLegacyTheme` maps old Studio v2 props ' +
            'onto it.',
          '',
          '### The two trees (the mechanism behind half our findings)',
          '',
          '`ThemeProvider` puts the theme and scheme into **React context**. When a `Card` (or ' +
            'any toned surface) renders, it resolves its tone slice and **emits ~73 `--card-*` ' +
            'CSS custom properties onto its own DOM element**, and from that point on, ' +
            'descendants like `Text`, `Code`, `KBD` and `Badge` style themselves with ' +
            '`var(--card-…)` and never touch a hex. So theme data travels **two different ' +
            'trees**: React context follows the *component* tree (and crosses portals), CSS ' +
            'custom properties follow the *DOM* tree (and stop at a portal boundary, because the ' +
            'portaled DOM is not a descendant). The **Property pipeline** story shows the ' +
            'emission live; the **Portal reach** story renders the proof of the split. The ' +
            'practical lesson: a scheme carried only as a class on an app container never reaches ' +
            '`document.body` portals. That is why this catalog’s theme decorator stamps the ' +
            'scheme globally, and why the contract requires verifying portaled layers (an open ' +
            'Dialog in dark mode) before calling theming done.',
          '',
          '### `color-scheme`: the native-UI seam',
          '',
          'A toned Card also emits the CSS `color-scheme` property (`dark` or `light`) on its ' +
            'element. That is what keeps *incidental* native UI, scrollbars, form-control chrome, ' +
            'the OS date-picker popup, legibly matched to the surrounding surface. It is a safety ' +
            'net, not a design: the native picker still ignores the type scale, the tones and the ' +
            'keyboard model, which is the audit’s `own the controls` case (law 7). The **Scheme ' +
            'emission** story shows the seam live with a bare `<input type="date">` under both ' +
            'schemes; the designed answer is the `Forms & Input/DateInputs` native-controls pair.',
          '',
          '### The icon pipeline',
          '',
          '`@sanity/icons` ships 236 symbols two ways: a generic `<Icon symbol="add-circle"/>` ' +
            'plus an `icons` map at the main entry, and one tree-shakeable component per symbol ' +
            "on subpaths (`import {AddCircleIcon} from '@sanity/icons/AddCircle'`). The **main " +
            'entry exports only `{Icon, icons}` at runtime**, and as of 5.2.0 the types say so ' +
            'honestly: every named `*Icon` on the root is declared `never` with a deprecation ' +
            'pointing to its subpath (which updates findings ledger #12, written when the types ' +
            'still suggested otherwise). This catalog therefore imports named icons from subpaths ' +
            'everywhere. The **Icon pipeline** story renders the full map, clustered by a curated ' +
            'taxonomy (`iconCategories.ts`; the package ships none), searchable across tabs, at ' +
            'the 25px crisp size by default (the only integer scale of the 25-unit viewBox, ' +
            'ledger #33) with 17/21/33 comparison toggles.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:systems', 'pattern:design-tokens', 'pattern:component-api-design'],
}

export default meta
type Story = StoryObj

const TONES = ['default', 'primary', 'positive', 'caution', 'critical'] as const
type ToneKey = (typeof TONES)[number]

/** Reads inherited `--card-*` values from wherever it is mounted. */
function VarProbe({label}: {label: string}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [bg, setBg] = useState('')
  const [fg, setFg] = useState('')
  // Re-read when the toolbar scheme flips; tone changes remount the probe via key.
  const {scheme} = useRootTheme()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const style = getComputedStyle(el)
    setBg(style.getPropertyValue('--card-bg-color').trim())
    setFg(style.getPropertyValue('--card-fg-color').trim())
  }, [scheme])

  return (
    <div ref={ref}>
      <Stack gap={2}>
        <Text size={1} weight="semibold">
          {label}
        </Text>
        <Code size={0}>{`--card-bg-color: ${bg || '(unset)'}`}</Code>
        <Code size={0}>{`--card-fg-color: ${fg || '(unset)'}`}</Code>
      </Stack>
    </div>
  )
}

// --- Property pipeline -----------------------------------------------------------

function PipelineDemo() {
  const [outer, setOuter] = useState<ToneKey>('primary')
  const [inner, setInner] = useState<ToneKey>('caution')

  return (
    <Stack gap={4} style={{maxWidth: 720}}>
      <Flex gap={2} wrap="wrap" align="center">
        <Text size={1} muted>
          outer tone:
        </Text>
        {TONES.map((tone) => (
          <UIButton
            key={tone}
            mode={outer === tone ? 'default' : 'ghost'}
            text={tone}
            fontSize={1}
            padding={2}
            onClick={() => setOuter(tone)}
          />
        ))}
      </Flex>
      <Flex gap={2} wrap="wrap" align="center">
        <Text size={1} muted>
          inner tone:
        </Text>
        {TONES.map((tone) => (
          <UIButton
            key={tone}
            mode={inner === tone ? 'default' : 'ghost'}
            text={tone}
            fontSize={1}
            padding={2}
            onClick={() => setInner(tone)}
          />
        ))}
      </Flex>

      <Card tone={outer} border radius={2} padding={4}>
        <Stack gap={4}>
          <VarProbe key={`outer-${outer}`} label={`outer Card, tone="${outer}"`} />
          <Card tone={inner} border radius={2} padding={4}>
            <VarProbe key={`inner-${outer}-${inner}`} label={`inner Card, tone="${inner}"`} />
          </Card>
        </Stack>
      </Card>

      <Text size={1} muted>
        Each Card re-emits the full custom-property set for its own tone, so the inner surface
        completely re-scopes its descendants: the components inside never change, only the variables
        they inherit. The full 73-property inventory is on Design Tokens → Card properties.
      </Text>
    </Stack>
  )
}

/**
 * The emission mechanism, live: nested Cards with independently switchable tones, each
 * probed with `getComputedStyle` from inside. Tone → custom properties → `var()` is
 * the entire styling contract between surfaces and their contents.
 */
export const PropertyPipeline: Story = {
  name: 'Property pipeline',
  render: () => <PipelineDemo />,
}

// --- Portal reach ----------------------------------------------------------------

function PortalDemo() {
  const [open, setOpen] = useState(true)

  return (
    <Stack gap={4} style={{maxWidth: 720}}>
      <Flex gap={4} wrap="wrap">
        <Box flex={1} style={{minWidth: 260}}>
          <Card tone="primary" border radius={2} padding={4}>
            <VarProbe label="Inside the toned Card (DOM descendant)" />
          </Card>
        </Box>
        <Box flex={1} style={{minWidth: 260}}>
          <Card border radius={2} padding={4}>
            <VarProbe label="Sibling, outside the Card" />
          </Card>
        </Box>
      </Flex>

      <Card border radius={2} padding={4}>
        <Flex align="center" gap={4}>
          <Popover
            open={open}
            portal
            placement="right"
            content={
              <Box padding={3} style={{maxWidth: 240}}>
                <VarProbe label="Popover content (portaled to body)" />
              </Box>
            }
          >
            <UIButton
              text={open ? 'Close the portaled popover' : 'Open the portaled popover'}
              mode="ghost"
              onClick={() => setOpen((v) => !v)}
            />
          </Popover>
        </Flex>
      </Card>

      <Text size={1} muted>
        The sibling probe shows the canvas values, not the primary Card’s, because custom properties
        follow the DOM tree. The popover’s probe is themed even though its DOM lives on
        `document.body`: React context crosses the portal, and the layer re-emits the variables at
        its own root. The trap: anything keyed off a CSS class on an app container (a scheme class,
        a `.dark` selector) never reaches portaled DOM, so stamp the scheme globally, then verify an
        open Dialog in dark mode.
      </Text>
    </Stack>
  )
}

/**
 * Proof of the two-tree split: a DOM sibling loses the Card’s variables, a portaled
 * Popover keeps its theme, because context crosses portals and CSS inheritance does
 * not. This is the catalog’s §5 portal-theming lesson rendered as a specimen.
 */
export const PortalReach: Story = {
  name: 'Portal reach',
  parameters: {docs: {story: {height: '420px'}}},
  render: () => (
    <LayerProvider>
      <PortalDemo />
    </LayerProvider>
  ),
}

// --- Scheme emission -------------------------------------------------------------

function SchemeProbe() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [emitted, setEmitted] = useState('')
  const {scheme} = useRootTheme()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setEmitted(getComputedStyle(el).colorScheme)
  }, [scheme])

  return (
    <div ref={ref}>
      <Code size={0}>{`color-scheme: ${emitted || '(unset)'}`}</Code>
    </div>
  )
}

function SchemeEmissionDemo() {
  return (
    <Flex gap={4} wrap="wrap" style={{maxWidth: 760}}>
      {(['light', 'dark'] as const).map((scheme) => (
        <Box key={scheme} flex={1} style={{minWidth: 280}}>
          {/* oxlint-disable-next-line no-deprecated -- matches real usage in packages/sanity/src/core/studio/colorScheme.tsx; not yet migrated anywhere in the real Studio source */}
          <ThemeProvider theme={studioTheme} scheme={scheme}>
            <Card border radius={2} padding={4}>
              <Stack gap={3}>
                <Text size={1} weight="semibold">
                  {`${scheme} island`}
                </Text>
                <SchemeProbe />
                {/* Deliberately native — the seam this story is about. */}
                <input type="date" style={{font: 'inherit', padding: 6}} />
                <Text size={1} muted>
                  Open the native picker: its chrome follows the emitted `color-scheme`.
                </Text>
              </Stack>
            </Card>
          </ThemeProvider>
        </Box>
      ))}
    </Flex>
  )
}

/**
 * The Card emits CSS `color-scheme` for its scheme: probe it live, then open each
 * native date picker and watch the browser chrome follow. A safety net for incidental
 * native UI, not a license to ship it: the designed answer is the DateInputs
 * native-controls pair (law 7, own the controls).
 */
export const SchemeEmission: Story = {
  name: 'Scheme emission',
  render: () => <SchemeEmissionDemo />,
}

// --- Icon pipeline ---------------------------------------------------------------

const ICON_MAP = new Map(Object.entries(icons))
const ICON_NAMES = [...ICON_MAP.keys()]

// Gallery sizes mirror the theme's icon steps (17/21/25/33). 25px is the crisp
// default: the 25-unit viewBox renders 1:1 there, every other size is a non-integer
// scale of the un-snapped 1.2-unit stroke (ledger #33) — the gallery models its own
// mitigation.
const ICON_SIZES = [17, 21, 25, 33]
const CRISP_SIZE = 25

function IconCell({
  name,
  icon: IconComponent,
  size,
}: {
  name: string
  icon: ComponentType
  size: number
}) {
  return (
    <Card border radius={2} padding={3} style={{width: 148}}>
      <Stack gap={3}>
        <Flex justify="center" style={{fontSize: size, lineHeight: 1}}>
          <IconComponent />
        </Flex>
        <Text size={1} align="center" textOverflow="ellipsis" title={name}>
          {name}
        </Text>
      </Stack>
    </Card>
  )
}

function IconGrid({symbols, size}: {symbols: string[]; size: number}) {
  return (
    <Flex gap={2} wrap="wrap">
      {symbols.map((name) => {
        const icon = ICON_MAP.get(name)
        return icon ? <IconCell key={name} name={name} icon={icon} size={size} /> : null
      })}
    </Flex>
  )
}

function IconPipelineDemo() {
  const [query, setQuery] = useState('')
  const [size, setSize] = useState(CRISP_SIZE)
  const [tab, setTab] = useState('all')

  const needle = query.toLowerCase().trim()
  const categories = categorizeIcons(ICON_NAMES).map((category) => ({
    ...category,
    symbols: needle ? category.symbols.filter((name) => name.includes(needle)) : category.symbols,
  }))
  const visible = categories.filter((category) => category.symbols.length > 0)
  const activeCategory = categories.find((category) => category.id === tab)
  const totalMatches = categories.reduce((sum, category) => sum + category.symbols.length, 0)

  return (
    <Stack gap={4}>
      <Flex align="center" gap={3} wrap="wrap">
        <Box flex={1} style={{minWidth: 220, maxWidth: 380}}>
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={`Search ${ICON_NAMES.length} symbols…`}
          />
        </Box>
        <Text size={1} muted>
          {`${totalMatches} match${totalMatches === 1 ? '' : 'es'}`}
        </Text>
        <Flex gap={1} align="center">
          {ICON_SIZES.map((px) => (
            <UIButton
              key={px}
              mode={size === px ? 'default' : 'ghost'}
              text={px === CRISP_SIZE ? `${px}px ✓` : `${px}px`}
              fontSize={1}
              padding={2}
              onClick={() => setSize(px)}
            />
          ))}
          <Text size={1} muted>
            25px is the integer-scale (crisp) size, ledger #33
          </Text>
        </Flex>
      </Flex>

      <TabList gap={1}>
        {[
          <Tab
            key="all"
            id="icon-tab-all"
            aria-controls="icon-panel"
            label={`All · ${totalMatches}`}
            selected={tab === 'all'}
            onClick={() => setTab('all')}
            fontSize={1}
          />,
          ...categories.map((category) => (
            <Tab
              key={category.id}
              id={`icon-tab-${category.id}`}
              aria-controls="icon-panel"
              label={`${category.title} · ${category.symbols.length}`}
              selected={tab === category.id}
              onClick={() => setTab(category.id)}
              fontSize={1}
            />
          )),
        ]}
      </TabList>

      <TabPanel
        id="icon-panel"
        aria-labelledby={tab === 'all' ? 'icon-tab-all' : `icon-tab-${tab}`}
      >
        {tab === 'all' ? (
          <Stack gap={5}>
            {visible.length === 0 && (
              <Text size={1} muted>
                No symbols match “{query}”.
              </Text>
            )}
            {visible.map((category) => (
              <Stack key={category.id} gap={3}>
                <Flex align="baseline" gap={2}>
                  <Text size={2} weight="semibold">
                    {category.title}
                  </Text>
                  <Text size={1} muted>
                    {category.symbols.length}
                  </Text>
                </Flex>
                <IconGrid symbols={category.symbols} size={size} />
              </Stack>
            ))}
          </Stack>
        ) : activeCategory && activeCategory.symbols.length > 0 ? (
          <IconGrid symbols={activeCategory.symbols} size={size} />
        ) : (
          <Text size={1} muted>
            {query ? `No “${tab}” symbols match “${query}”.` : 'No symbols in this category.'}
          </Text>
        )}
      </TabPanel>
    </Stack>
  )
}

/**
 * Every symbol in `@sanity/icons`, clustered by a curated taxonomy (the package ships
 * none; see iconCategories.ts, with an uncategorized catch-all so upstream additions
 * never vanish), searchable across tabs, rendered at 25px by default: the only
 * integer-scale size for the 25-unit viewBox, so the gallery models the crisp-zone
 * mitigation ledger #33 documents; the 17/21/33 toggles show the softness cost. For
 * production imports use the per-icon subpaths (`@sanity/icons/AddCircle`), the
 * tree-shakeable path, and the only named-component path that resolves under
 * rolldown-vite (findings ledger #12).
 */
export const IconPipeline: Story = {
  name: 'Icon pipeline',
  render: () => <IconPipelineDemo />,
}
