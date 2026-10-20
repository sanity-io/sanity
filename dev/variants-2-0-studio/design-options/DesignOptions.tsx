import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowTopRightIcon} from '@sanity/icons/ArrowTopRight'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
import {CogIcon} from '@sanity/icons/Cog'
import {ControlsIcon} from '@sanity/icons/Controls'
import {CopyIcon} from '@sanity/icons/Copy'
import {DragHandleIcon} from '@sanity/icons/DragHandle'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {LaunchIcon} from '@sanity/icons/Launch'
import {LinkIcon} from '@sanity/icons/Link'
import {PlayIcon} from '@sanity/icons/Play'
import {RemoveIcon} from '@sanity/icons/Remove'
import {Box, Button, Card, Flex, LayerProvider, Stack, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {createPortal} from 'react-dom'

import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {ToastPreviews} from '../toasts/ToastPreviews'
import {getConfig, NOT_DRAWN_LABEL} from './config'
import {OptionDiagram, SpecDiagram} from './diagram'
import {PresetBar} from './PresetBar'
import {
  designLink,
  fellBack,
  type GlobalChoice,
  getOptionState,
  maxOptionCount,
  resetOverrides,
  resolveOption,
  setDimensionLimit,
  setGlobalChoice,
  setOverride,
  setPillWhenOpen,
  setRowLayout,
  setListWhenPerspective,
  setPriorityView,
  setToastAction,
  setToastStyle,
  setShape,
  setStage,
  type State,
  useOptionState,
} from './store'
import {TAB_ID} from './tab'
import {type ComponentDef, type OptionDef} from './types'

const LETTERS = 'ABCDEFGH'
/** Icons beside labels in the footer and card links are 18px (the library's size). */
const ICON_18 = {fontSize: 18} as const

/**
 * The window's surface layers (Figma 305:480): a soft vertical gradient behind everything, a lifted title band, raised cards,
 * a translucent list panel and footer. The colours mix the Studio tokens, so light and dark follow the theme.
 */
const MIX = (pct: number) =>
  `color-mix(in srgb, var(--card-bg-color) ${pct}%, var(--card-link-fg-color))`
const SURFACE = {
  window: `linear-gradient(180deg, ${MIX(95)} 0%, ${MIX(88)} 100%)`,
  band: {
    background: 'var(--card-bg-color)',
    boxShadow: '0 1px 0 var(--card-border-color), 0 2px 8px rgba(0, 0, 0, 0.05)',
    position: 'relative',
    zIndex: 1,
  } as const,
  raised: {
    background: 'var(--card-bg-color)',
    borderRadius: 10,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06), 0 4px 14px rgba(0, 0, 0, 0.05)',
  } as const,
  panel: {
    background: 'color-mix(in srgb, var(--card-bg-color) 62%, transparent)',
    border: '1px solid var(--card-border-color)',
    borderRadius: 10,
  } as const,
  footer: {
    background: 'color-mix(in srgb, var(--card-bg-color) 70%, transparent)',
    borderTop: '1px solid var(--card-border-color)',
  } as const,
  selected:
    'linear-gradient(180deg, color-mix(in srgb, var(--card-badge-suggest-dot-color) 9%, var(--card-bg-color)) 0%, var(--card-bg-color) 70%)',
}
const TOASTS_ID = '__toasts'
const WINDOW_KEY = () => `${getConfig().storageKey}:window`
const DEFAULT_SIZE = {w: 720, h: 560}
const MIN_SIZE = {w: 560, h: 400}

const NOT_DRAWN = NOT_DRAWN_LABEL

type Dot = 'positive' | 'suggest' | 'default'

/** decided = positive, candidate = suggest, not drawn = muted. */
function statusOf(component: ComponentDef): Dot {
  if (component.final) return 'positive'
  return component.options.some((option) => option.label !== NOT_DRAWN) ? 'suggest' : 'default'
}

function StatusDot({
  color,
  title,
}: {
  color: 'positive' | 'suggest' | 'caution' | 'default'
  title: string
}) {
  return (
    <span
      aria-label={title}
      role="img"
      style={{
        background:
          color === 'default'
            ? 'var(--card-muted-fg-color)'
            : `var(--card-badge-${color}-dot-color)`,
        borderRadius: '50%',
        display: 'block',
        flex: 'none',
        height: 8,
        opacity: color === 'default' ? 0.5 : 1,
        width: 8,
      }}
      title={title}
    />
  )
}

interface SegmentOption<T> {
  value: T
  label: string
  disabled?: boolean
  title?: string
}

/** One control style for the whole panel: 25px buttons at 3px, the selected one filled. Arrows move inside it. */
function Segmented<T extends string | number | null>(props: {
  ariaLabel: string
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  fullWidth?: boolean
  disabled?: boolean
}) {
  const {ariaLabel, options, value, onChange, fullWidth, disabled} = props
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const step = event.key === 'ArrowRight' ? 1 : -1
    const current = options.findIndex((option) => option.value === value)
    for (let i = 1; i <= options.length; i++) {
      const at = (current + step * i + options.length * i) % options.length
      if (!options[at].disabled) {
        event.preventDefault()
        onChange(options[at].value)
        refs.current[at]?.focus()
        return
      }
    }
  }

  return (
    <Card
      border
      data-segmented
      padding={0}
      radius={2}
      style={{display: 'inline-flex', padding: 3}}
      tone="transparent"
    >
      <Flex aria-label={ariaLabel} gap={1} onKeyDown={onKeyDown} role="radiogroup">
        {options.map((option, index) => {
          const selected = option.value === value
          return (
            <Box flex={fullWidth ? 1 : undefined} key={String(option.value)}>
              <Button
                aria-checked={selected}
                disabled={disabled || option.disabled}
                fontSize={1}
                mode={selected ? 'default' : 'bleed'}
                onClick={() => onChange(option.value)}
                padding={2}
                ref={(el: HTMLButtonElement | null) => {
                  refs.current[index] = el
                }}
                role="radio"
                style={{height: 25, width: fullWidth ? '100%' : undefined}}
                tabIndex={selected ? 0 : -1}
                text={option.label}
                title={option.title}
                tone={selected ? 'primary' : 'default'}
              />
            </Box>
          )
        })}
      </Flex>
    </Card>
  )
}

type Rect = {x: number; y: number; w: number; h: number}

function clampRect(r: Rect): Rect {
  const w = Math.min(Math.max(r.w, MIN_SIZE.w), window.innerWidth - 8)
  const h = Math.min(Math.max(r.h, MIN_SIZE.h), window.innerHeight - 8)
  return {
    w,
    h,
    x: Math.min(Math.max(r.x, 0), window.innerWidth - w),
    y: Math.min(Math.max(r.y, 0), window.innerHeight - h),
  }
}

/** Bottom left, above the collapsed control: where the panel used to sit. */
function dockedRect(): Rect {
  return clampRect({...DEFAULT_SIZE, x: 16, y: window.innerHeight - DEFAULT_SIZE.h - 16 - 25 - 8})
}

function loadRect(): Rect {
  try {
    const raw = window.localStorage.getItem(WINDOW_KEY())
    if (raw) return clampRect(JSON.parse(raw))
  } catch {
    // Storage can be blocked; the window then starts docked.
  }
  return dockedRect()
}

function figmaLinks(refs: string | undefined): {label: string; href: string}[] {
  if (!refs) return []
  return [...refs.matchAll(/(\d+):(\d+)/g)].map((m) => ({
    label: 'Figma',
    href: `${getConfig().links?.figmaFile}?node-id=${m[1]}-${m[2]}`,
  }))
}

/** What "Show" alone would give this component, so a per-component choice can be marked as changed. */
function showOption(component: ComponentDef, state: State): string {
  return resolveOption(component, {...state, overrides: {}})
}

const STATUS_WORD: Record<string, {word: string; dot: Dot}> = {
  'final': {word: 'decided', dot: 'positive'},
  'candidate': {word: 'candidate', dot: 'suggest'},
  'exploration': {word: 'exploration', dot: 'default'},
  'not-drawn': {word: 'not drawn', dot: 'default'},
  'archived': {word: 'archived (kept so old links resolve)', dot: 'default'},
}

/** First sentence of a summary: one line for a card. */
function oneLine(text: string): string {
  const first = text.split(/(?<=[.!?])\s/)[0]
  return first.length > 110 ? `${first.slice(0, 107)}…` : first
}

// The Storybook index, fetched once per session (base + /index.json). Behind a sign-in it may not load; then links open as given.
let storyIndex: Promise<string[] | null> | null = null
function loadStoryIndex(): Promise<string[] | null> {
  const base = getConfig().links?.storybookBase
  if (!base) return Promise.resolve(null)
  storyIndex ??= fetch(`${base}/index.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      const body = json?.entries ?? json
      return Array.isArray(body)
        ? body.map((e: {id: string}) => e.id)
        : body
          ? (Object.keys(body) as string[])
          : null
    })
    .catch(() => null)
  return storyIndex
}

/** The valid story closest to an id that is not in the index: the same component page, else the longest shared prefix. */
export function nearestStory(id: string, ids: string[]): string | null {
  const page = id.split('--')[0]
  const same = ids.filter((x) => x.startsWith(`${page}--`))
  if (same.length) return same.find((x) => x.endsWith('--docs')) ?? same[0]
  let best: string | null = null
  let bestLen = 0
  for (const x of ids) {
    let n = 0
    while (n < x.length && n < id.length && x[n] === id[n]) n++
    if (n > bestLen) {
      bestLen = n
      best = x
    }
  }
  return bestLen > 20 ? best : null
}

/** A link as a secondary button with the external-link icon (not a bare underlined link). */
function LinkButton(props: {
  href: string
  label: string
  testId: string
  moved?: boolean
  title?: string
}) {
  return (
    <Button
      as="a"
      data-moved={props.moved ? '' : undefined}
      data-testid={props.testId}
      fontSize={1}
      href={props.href}
      icon={<LaunchIcon style={ICON_18} />}
      mode="ghost"
      onClick={(e: {stopPropagation: () => void}) => e.stopPropagation()}
      padding={2}
      rel="noreferrer"
      style={{height: 31}}
      target="_blank"
      text={props.label}
      title={props.title}
    />
  )
}

/** A Storybook link that cannot end on Storybook's error page: a missing story opens the nearest valid one, with a note. */
function StoryLink({id}: {id: string}) {
  const {
    shape,
    rowLayout,
    pillWhenOpen,
    toastAction,
    toastStyle,
    listWhenPerspective,
    priorityView,
  } = useOptionState()
  const optionState = useOptionState()
  // The E9 switches carry the same names as Storybook globals (paneAddress, compare, reviewPanel, listMark, listFlyout, reviewPass, fieldMarks).
  const e9Globals = getConfig()
    .components.filter((component) => component.independent)
    .map((component) => `;${component.id}:${resolveOption(component, optionState)}`)
    .join('')
  const [ids, setIds] = useState<string[] | null>(null)
  useEffect(() => {
    let alive = true
    void loadStoryIndex().then((list) => alive && setIds(list))
    return () => {
      alive = false
    }
  }, [])
  const missing = !!ids && !ids.includes(id)
  const target = missing ? (nearestStory(id, ids) ?? id) : id
  return (
    <LinkButton
      href={`${getConfig().links?.storybookBase}/?path=/story/${target}&globals=theme:${window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'};shape:${shape};rowLayout:${rowLayout};pillWhenOpen:${pillWhenOpen};toastAction:${toastAction};toastStyle:${toastStyle};listWhenPerspective:${listWhenPerspective};priorityView:${priorityView}${e9Globals}`}
      label={missing ? 'Storybook (moved)' : 'Storybook'}
      moved={missing}
      testId="story-link"
      title={missing ? 'Story moved: this opens the nearest story' : undefined}
    />
  )
}

function OptionCard(props: {
  component: ComponentDef
  option: OptionDef
  letter: string
  chosen: boolean
  stock: boolean
}) {
  const {component, option, letter, chosen, stock} = props
  const notDrawn = option.label === NOT_DRAWN
  const status = notDrawn ? {word: 'not drawn', dot: 'default' as Dot} : STATUS_WORD[option.status]
  const figma = figmaLinks(option.refs)[0]
  const entry = option.diagramKey ? getConfig().diagrams?.diagrams[option.diagramKey] : undefined
  const dashed = notDrawn || option.status === 'not-drawn'
  const border = chosen
    ? '2px solid var(--card-badge-suggest-dot-color)'
    : `1px ${dashed ? 'dashed' : 'solid'} var(--card-border-color)`
  const pick = () => {
    if (notDrawn || stock) return
    const base = showOption(component, getOptionState())
    setOverride(component.id, option.id === base ? null : option.id)
  }

  return (
    <div
      aria-checked={chosen}
      aria-disabled={notDrawn || stock}
      onClick={pick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          pick()
        }
      }}
      role="radio"
      style={{
        background: chosen ? SURFACE.selected : 'var(--card-bg-color)',
        border,
        borderRadius: 10,
        boxShadow: chosen ? '0 2px 10px rgba(110, 70, 220, 0.18)' : SURFACE.raised.boxShadow,
        cursor: notDrawn || stock ? 'default' : 'pointer',
        opacity: notDrawn || stock ? 0.6 : option.status === 'archived' ? 0.7 : 1,
        padding: chosen ? 11 : 12,
        position: 'relative',
      }}
      tabIndex={notDrawn || stock ? -1 : 0}
    >
      <Stack gap={3}>
        <Box style={{display: 'flex', justifyContent: 'center'}}>
          {notDrawn ? (
            <OptionDiagram />
          ) : entry ? (
            <div style={{width: '100%'}}>
              <SpecDiagram entry={entry} />
            </div>
          ) : (
            <div style={{width: '100%'}}>
              <OptionDiagram spec={option.diagram} />
            </div>
          )}
        </Box>
        <Stack gap={2}>
          <Text size={1} weight="medium">
            {letter} · {notDrawn ? NOT_DRAWN : option.label}
          </Text>
          <Text muted size={0} style={{minHeight: 32}}>
            {notDrawn
              ? 'No design for this option yet.'
              : (option.oneLiner ?? oneLine(option.summary))}
          </Text>
          <Flex align="center" gap={2}>
            <StatusDot color={status.dot} title={status.word} />
            <Text muted size={0}>
              {status.word}
            </Text>
          </Flex>
          <Flex gap={2}>
            {figma ? <LinkButton href={figma.href} label="Figma" testId="figma-link" /> : null}
            {option.story ? <StoryLink id={option.story} /> : null}
          </Flex>
        </Stack>
      </Stack>
      {chosen ? (
        <span
          style={{
            color: 'var(--card-badge-suggest-dot-color)',
            position: 'absolute',
            right: 6,
            top: 4,
          }}
        >
          <CheckmarkIcon style={{fontSize: 20}} />
        </span>
      ) : null}
    </div>
  )
}

const PILL: Record<string, string> = {
  win: 'var(--card-badge-positive-dot-color)',
  even: 'var(--card-badge-suggest-dot-color)',
  open: 'var(--card-muted-fg-color)',
}

/** The spec keys that belong to a component: its own, then each option's card diagram and extra frames. */
function frameKeys(component: ComponentDef): string[] {
  const keys = component.options.flatMap((o) =>
    o.diagramKey ? [o.diagramKey, ...(o.frames ?? [])] : [],
  )
  return [...new Set([...keys, ...(component.frames ?? [])])]
}

/** Every drawn frame of the component, with its status and caption (the same spec the tracker reads). */
function FramesGallery({component}: {component: ComponentDef}) {
  const file = getConfig().diagrams
  const entries = frameKeys(component).flatMap((key) =>
    file?.diagrams[key] ? [{key, entry: file.diagrams[key]}] : [],
  )
  if (!entries.length) return null
  return (
    <Stack data-testid="frames-gallery" gap={2}>
      <Label>Frames</Label>
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        }}
      >
        {entries.map(({key, entry}) => (
          <figure key={key} style={{margin: 0}}>
            <SpecDiagram entry={entry} />
            <figcaption style={{fontSize: 12, marginTop: 6}}>
              <b>{entry.name}</b>{' '}
              <span style={{color: PILL[entry.status.class]}}>● {entry.status.text}</span>
              <br />
              <span style={{color: 'var(--card-muted-fg-color)'}}>{entry.caption}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Stack>
  )
}

function Label({children, accent}: {children: string; accent?: boolean}) {
  return (
    <Text
      muted={!accent}
      size={0}
      style={{
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        ...(accent ? {color: 'var(--card-link-fg-color)'} : {}),
      }}
      weight="medium"
    >
      {children}
    </Text>
  )
}

function summary(state: State): string {
  const show =
    state.global === 'stock' ? 'Stock' : state.global === 'final' ? 'Final' : LETTERS[state.global]
  const lines = [
    `Show: ${show}`,
    `Stage: ${getConfig().scenario.stages.find((x) => x.id === state.stage)?.label ?? state.stage}`,
  ]
  if (state.global !== 'stock') {
    lines.push(
      getConfig()
        .components.filter((c) => c.built)
        .map((c) => `${(c.tag ?? c.id).toUpperCase()} ${resolveOption(c, state).toUpperCase()}`)
        .join(' · '),
    )
  }
  return lines.join('\n')
}

function RailRow(props: {
  component: ComponentDef
  state: State
  selected: boolean
  onSelect: () => void
}) {
  const {component, state, selected, onSelect} = props
  const stock = state.global === 'stock'
  const active = resolveOption(component, state)
  const changed =
    !stock &&
    !component.independent &&
    state.overrides[component.id] !== undefined &&
    active !== showOption(component, state)
  const fallback = fellBack(component, state)
  const name = component.title.replace(new RegExp(`^${component.id.toUpperCase()}\\s*`), '')
  return (
    <Card
      aria-current={selected}
      as="button"
      onClick={onSelect}
      padding={2}
      radius={2}
      selected={selected}
      style={{cursor: 'pointer', opacity: stock ? 0.6 : 1, textAlign: 'left', width: '100%'}}
      tone="default"
    >
      <Flex align="center" gap={2}>
        <Text muted={!selected} size={0}>
          {(component.tag ?? component.id).toUpperCase()}
        </Text>
        <Box flex={1}>
          <Text size={1}>{name}</Text>
        </Box>
        {changed ? <StatusDot color="caution" title="Differs from Show" /> : null}
        <span
          style={{
            alignItems: 'center',
            border: '1px solid var(--card-border-color)',
            borderRadius: 9999,
            display: 'flex',
            fontSize: 11,
            height: 18,
            justifyContent: 'center',
            minWidth: fallback ? 24 : 18,
            padding: fallback ? '0 4px' : 0,
          }}
          title={
            fallback
              ? `Show asks for a letter this component does not have: A, fallback`
              : `Option ${active.toUpperCase()}`
          }
        >
          {stock ? '–' : active.toUpperCase()}
          {fallback ? '*' : ''}
        </span>
      </Flex>
    </Card>
  )
}

/** Dimensions: a dropdown (All, 1 to 5). Open beta has one dimension, so it only applies at the GA stage. */
function DimensionsMenu({state}: {state: State}) {
  const options = getConfig().scenario.dimensions ?? []
  const enabled = state.stage === getConfig().scenario.dimensionsStage
  const current = options.find((d) => d.value === state.dimensionLimit) ?? options[0]
  return (
    <MenuButton
      button={
        <Button
          data-testid="dimensions-menu"
          disabled={!enabled}
          fontSize={1}
          iconRight={ChevronDownIcon}
          mode="ghost"
          padding={2}
          style={{height: 33, minWidth: 96}}
          text={current?.label ?? 'All'}
          title={
            enabled
              ? 'How many dimensions the design shows'
              : 'Open beta has one dimension; pick GA to change this'
          }
        />
      }
      id="options-dimensions-menu"
      menu={
        <Menu padding={1}>
          {options.map((d) => (
            <MenuItem
              key={String(d.value)}
              onClick={() => setDimensionLimit(d.value)}
              pressed={d.value === state.dimensionLimit}
              text={d.label}
              tooltipProps={d.title ? {content: d.title} : undefined}
            />
          ))}
        </Menu>
      }
      popover={{placement: 'bottom-start', portal: true}}
    />
  )
}

/** The Storybook base without the host noise: "git-explorations-variants-2-0". */
function storybookBaseLabel(base: string | undefined): string {
  if (!base) return ''
  try {
    return new URL(base).hostname
      .replace(/^sanity-studio-storybook-/, '')
      .replace(/\.sanity\.dev$/, '')
  } catch {
    return base
  }
}

/** A footer action: an 18px icon and a 13px label; icon-only (with a tooltip and an accessible name) when the window is narrow. */
function FooterAction(props: {
  icon: ComponentType<{style?: CSSProperties}>
  label: string
  iconOnly?: boolean
  onClick?: () => void
}) {
  const Icon = props.icon
  return (
    <Button
      aria-label={props.label}
      fontSize={1}
      icon={<Icon style={ICON_18} />}
      mode="bleed"
      onClick={props.onClick}
      padding={2}
      style={{height: 33, ...(props.iconOnly ? {width: 33} : {})}}
      text={props.iconOnly ? undefined : props.label}
      title={props.label}
    />
  )
}

/** The one-line summary of the settings, for the collapsed strip: "Open beta · All · Round · Options A". */
function settingsSummary(state: State): string {
  const stage = getConfig().scenario.stages.find((x) => x.id === state.stage)?.label ?? state.stage
  const dims =
    getConfig().scenario.dimensions && state.stage === getConfig().scenario.dimensionsStage
      ? ((getConfig().scenario.dimensions ?? []).find((d) => d.value === state.dimensionLimit)
          ?.label ?? 'All')
      : null
  const all =
    state.global === 'stock' ? 'Stock' : state.global === 'final' ? 'Final' : LETTERS[state.global]
  return [
    stage,
    dims && `${dims} dimensions`,
    getConfig().shape ? (state.shape === 'box' ? 'Box' : 'Round') : null,
    `All: ${all}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** The settings, in three groups named by what they change: World (data and scope), Look (how things are drawn), Options for all. */
function SettingsGroups({
  state,
  showOptions,
}: {
  state: State
  showOptions: SegmentOption<GlobalChoice>[]
}) {
  const group = (title: string, children: ReactNode, first = false) => (
    <Stack
      data-testid={`settings-${title.toLowerCase().replace(/\s+/g, '-')}`}
      gap={3}
      key={title}
      style={
        first ? undefined : {borderLeft: '1px solid var(--card-border-color)', paddingLeft: 20}
      }
    >
      <Label accent>{title}</Label>
      <Flex align="flex-start" gap={4} wrap="wrap">
        {children}
      </Flex>
    </Stack>
  )
  const control = (label: string, node: ReactNode) => (
    <Stack gap={2}>
      <Text muted size={0}>
        {label}
      </Text>
      {node}
    </Stack>
  )
  return (
    <Card border padding={3} style={SURFACE.raised}>
      <Flex gap={4} wrap="wrap">
        {group(
          'World',
          <>
            {control(
              'Priority view (open beta scope)',
              <Segmented
                ariaLabel="Priority view"
                onChange={(value) => setPriorityView(value)}
                options={[
                  {
                    value: 'hide',
                    label: 'Hide',
                    title: 'Open beta scope: the inventory panel has no Priority view',
                  },
                  {
                    value: 'show',
                    label: 'Show',
                    title: "Andrej's Priority view stays in the views list",
                  },
                ]}
                value={state.priorityView}
              />,
            )}
            {control(
              'Stage',
              <Segmented
                ariaLabel="Stage"
                onChange={(value) => setStage(value)}
                options={getConfig().scenario.stages.map((stage) => ({
                  value: stage.id,
                  label: stage.label,
                }))}
                value={state.stage}
              />,
            )}
            {getConfig().scenario.dimensions
              ? control('Dimensions', <DimensionsMenu state={state} />)
              : null}
          </>,
          true,
        )}
        {getConfig().shape
          ? group(
              'Look',
              <>
                {control(
                  'Shape',
                  <Segmented
                    ariaLabel="Shape"
                    onChange={(value) => setShape(value)}
                    options={[
                      {
                        value: 'round',
                        label: 'Round',
                        title: 'Shipped: full-radius pills and chips',
                      },
                      {value: 'box', label: 'Box', title: 'Proposal: 3px radius'},
                    ]}
                    value={state.shape}
                  />,
                )}
                {control(
                  state.overrides.navLayout === 'c'
                    ? 'Row layout (not used with Nav C: no row)'
                    : 'Row layout',
                  <Segmented
                    ariaLabel="Row layout"
                    onChange={(value) => setRowLayout(value)}
                    options={[
                      {
                        value: 'left',
                        label: 'Left',
                        title:
                          'Showing and the chips on the left, Add dimension and Clear follow them',
                      },
                      {
                        value: 'actionsRight',
                        label: 'Actions right',
                        title:
                          'Showing and the chips on the left, Add dimension and Clear pinned to the right edge',
                      },
                      {
                        value: 'centered',
                        label: 'Centred',
                        title:
                          'Showing and the chips centred, Add dimension and Clear pinned right',
                      },
                    ]}
                    value={state.rowLayout}
                  />,
                )}
                {control(
                  'Pill when the row is open',
                  <Segmented
                    ariaLabel="Pill when the row is open"
                    onChange={(value) => setPillWhenOpen(value)}
                    options={[
                      {
                        value: 'summary',
                        label: 'Summary',
                        title: 'The pill keeps the full summary',
                      },
                      {
                        value: 'versionCount',
                        label: 'Version and count',
                        title:
                          'The pill shows the version and a count badge; the row shows the values',
                      },
                    ]}
                    value={state.pillWhenOpen}
                  />,
                )}
                {control(
                  'Toast action',
                  <Segmented
                    ariaLabel="Toast action"
                    onChange={(value) => setToastAction(value)}
                    options={[
                      {
                        value: 'button',
                        label: 'Button',
                        title: 'A filled button at the bottom right of the toast',
                      },
                      {
                        value: 'link',
                        label: 'Link',
                        title: 'An underlined text link under the message',
                      },
                    ]}
                    value={state.toastAction}
                  />,
                )}
                {control(
                  'Toast style',
                  <Segmented
                    ariaLabel="Toast style"
                    onChange={(value) => setToastStyle(value)}
                    options={[
                      {
                        value: 'stock',
                        label: 'Stock',
                        title: 'The toast as Studio draws it today: 380px, no status icon',
                      },
                      {
                        value: 'proposed',
                        label: 'Proposed',
                        title:
                          'A status icon, 400px wide and an action slot at the end (a Studio change, not approved)',
                      },
                    ]}
                    value={state.toastStyle}
                  />,
                )}
                {control(
                  'List when a perspective is active',
                  <Segmented
                    ariaLabel="List when a perspective is active"
                    onChange={(value) => setListWhenPerspective(value)}
                    options={[
                      {
                        value: 'grouped',
                        label: 'Grouped',
                        title:
                          'C3 option D: two sections, Has variant and No variant for this perspective',
                      },
                      {
                        value: 'sorted',
                        label: 'Sorted',
                        title: 'C3 option D: the documents that match come first, no sections',
                      },
                    ]}
                    value={state.listWhenPerspective}
                  />,
                )}
              </>,
            )
          : null}
        {group(
          'Options for all',
          control(
            'Set every component to',
            <Segmented
              ariaLabel="Options for all"
              onChange={(value) => setGlobalChoice(value)}
              options={showOptions}
              value={state.global}
            />,
          ),
        )}
      </Flex>
    </Card>
  )
}

/** Everything under the title bar: presets, Show and scenario, the rail, the option cards, the footer. */
function ConfigBody({
  state,
  onHide,
  compact,
  iconOnly,
}: {
  state: State
  onHide?: () => void
  compact?: boolean
  iconOnly?: boolean
}) {
  const [selectedId, setSelectedId] = useState('c1')
  const [copied, setCopied] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [framesOn, setFramesOn] = useState(false)
  const toastsSelected = selectedId === TOASTS_ID
  const stock = state.global === 'stock'
  const selected =
    getConfig().components.find((c) => c.id === selectedId) ?? getConfig().components[0]
  const active = resolveOption(selected, state)
  const changedCount = getConfig().components.filter(
    (c) => state.overrides[c.id] !== undefined && resolveOption(c, state) !== showOption(c, state),
  ).length
  const maxChoices = maxOptionCount()
  const showOptions: SegmentOption<GlobalChoice>[] = [
    {
      value: 'stock',
      label: 'Stock',
      title: 'Stock Studio: every design slot renders what Studio does today',
    },
    // Only the letters some component has (D and E are not offered unless used).
    ...Array.from({length: Math.min(Math.max(maxChoices, 1), 5)}, (_, index) => ({
      value: index as GlobalChoice,
      label: LETTERS[index],
    })),
    {value: 'final', label: 'Final', title: "Each component's signed-off option"},
  ]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(designLink())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked.
    }
  }

  return (
    <>
      <Box padding={3}>
        <Stack gap={3}>
          <PresetBar state={state} />
          {compact ? (
            <div style={{position: 'relative'}}>
              <Flex align="center" gap={3}>
                <Text data-testid="settings-summary" muted size={1} style={{flex: 1}}>
                  {settingsSummary(state)}
                </Text>
                <Button
                  aria-expanded={settingsOpen}
                  fontSize={1}
                  icon={CogIcon}
                  mode="ghost"
                  onClick={() => setSettingsOpen((v) => !v)}
                  padding={2}
                  selected={settingsOpen}
                  style={{height: 25}}
                  text="Settings"
                />
              </Flex>
              {settingsOpen ? (
                <Card
                  border
                  data-testid="settings-popover"
                  padding={3}
                  radius={3}
                  shadow={3}
                  style={{left: 0, position: 'absolute', right: 0, top: 33, zIndex: 5}}
                >
                  <SettingsGroups showOptions={showOptions} state={state} />
                </Card>
              ) : null}
            </div>
          ) : (
            <SettingsGroups showOptions={showOptions} state={state} />
          )}
        </Stack>
      </Box>

      <Flex style={{flex: 1, minHeight: 0}}>
        <Box
          padding={2}
          style={{
            ...SURFACE.panel,
            flexShrink: 0,
            margin: '0 0 12px 12px',
            overflow: 'auto',
            width: 240,
          }}
        >
          <Stack gap={3}>
            {getConfig().groups.map((group) => (
              <Stack gap={1} key={group.label}>
                <Box paddingX={2}>
                  <Label>{group.label}</Label>
                </Box>
                {group.ids.map((id) => {
                  const component = getConfig().components.find((c) => c.id === id)
                  return component ? (
                    <RailRow
                      component={component}
                      key={id}
                      onSelect={() => setSelectedId(id)}
                      selected={id === selectedId}
                      state={state}
                    />
                  ) : null
                })}
              </Stack>
            ))}
            <Stack gap={1}>
              <Box paddingX={2}>
                <Label>Feedback</Label>
              </Box>
              <Card
                aria-current={toastsSelected}
                as="button"
                data-testid="rail-toasts"
                onClick={() => setSelectedId(TOASTS_ID)}
                padding={2}
                radius={2}
                selected={toastsSelected}
                style={{cursor: 'pointer', textAlign: 'left', width: '100%'}}
                tone="default"
              >
                <Text size={1}>Result toasts</Text>
              </Card>
            </Stack>
          </Stack>
        </Box>
        {toastsSelected ? (
          <Box flex={1} padding={3} style={{overflow: 'auto'}}>
            <ToastPreviews />
          </Box>
        ) : (
          <Box flex={1} padding={3} style={{overflow: 'auto'}}>
            <Stack gap={3}>
              <Stack gap={1}>
                <Flex align="baseline" gap={3}>
                  <Box flex={1}>
                    <Text size={2} weight="medium">
                      {selected.title}
                    </Text>
                  </Box>
                  {getConfig().links?.storybookBase ? (
                    <Text
                      data-testid="storybook-base"
                      muted
                      size={0}
                      title={getConfig().links?.storybookBase}
                    >
                      Storybook base: {storybookBaseLabel(getConfig().links?.storybookBase)}
                    </Text>
                  ) : null}
                </Flex>
                <Text muted size={0}>
                  {stock
                    ? 'Stock Studio is showing; pick A, B, C in Options for all to compare.'
                    : fellBack(selected, state)
                      ? `Showing ${active.toUpperCase()}, fallback: Options for all asks for a letter this component does not have.`
                      : `Showing option ${active.toUpperCase()}. Click a card to apply it.`}
                </Text>
              </Stack>
              <div
                role="radiogroup"
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 350px))',
                }}
              >
                {selected.options.map((option, index) => (
                  <OptionCard
                    chosen={!stock && option.id === active}
                    component={selected}
                    key={option.id}
                    letter={LETTERS[index]}
                    option={option}
                    stock={stock}
                  />
                ))}
              </div>
              {frameKeys(selected).length ? (
                <Flex>
                  <Button
                    aria-pressed={framesOn}
                    data-testid="frames-toggle"
                    fontSize={1}
                    mode="bleed"
                    onClick={() => setFramesOn((v) => !v)}
                    padding={2}
                    style={{height: 31}}
                    text={framesOn ? 'Hide frame previews' : 'Show frame previews'}
                  />
                </Flex>
              ) : null}
              {framesOn ? <FramesGallery component={selected} /> : null}
            </Stack>
          </Box>
        )}
      </Flex>

      <Box padding={2} style={SURFACE.footer}>
        <Flex align="center" gap={1}>
          <Button
            disabled={changedCount === 0}
            fontSize={1}
            mode="bleed"
            onClick={resetOverrides}
            padding={2}
            style={{height: 33}}
            text="Reset all"
          />
          <Box flex={1} />
          {getConfig().links?.remote ? (
            <FooterAction
              icon={ControlsIcon}
              iconOnly={iconOnly}
              label="Options remote"
              onClick={() =>
                window.open(
                  `${getConfig().links!.remote}?tab=${TAB_ID}`,
                  'variants-2-0-options-remote',
                  'popup,width=520,height=820',
                )
              }
            />
          ) : null}
          {getConfig().links?.journeysRemote ? (
            <FooterAction
              icon={PlayIcon}
              iconOnly={iconOnly}
              label="Journeys remote"
              onClick={() =>
                window.open(
                  `${getConfig().links!.journeysRemote}?tab=${TAB_ID}&storybook=${encodeURIComponent(getConfig().links?.storybookBase ?? '')}`,
                  'variants-2-0-remote',
                  'popup,width=1280,height=860',
                )
              }
            />
          ) : null}
          <FooterAction
            icon={copied ? CopyIcon : LinkIcon}
            iconOnly={iconOnly}
            label={copied ? 'Copied' : 'Copy link'}
            onClick={copy}
          />
          <FooterAction
            icon={EyeClosedIcon}
            iconOnly={iconOnly}
            label="Hide until refresh"
            onClick={onHide}
          />
        </Flex>
      </Box>
    </>
  )
}

/** The text of a sheet's rules, or null when it cannot be read (cross-origin). */
function sheetText(sheet: CSSStyleSheet): string | null {
  try {
    return Array.from(sheet.cssRules)
      .map((rule) => rule.cssText)
      .join('\n')
  } catch {
    return null
  }
}

/**
 * Keep another document's styles in step with the app's. Components inject their CSS the first time they render
 * (for example a text input), so a one-off copy at open time misses everything that renders later. This copies new
 * sheets, re-copies a sheet whose rule count changed, and runs on a timer and when `<head>` changes.
 */
function startStyleSync(target: Document): () => void {
  const copies = new Map<CSSStyleSheet, {el: HTMLElement; rules: number}>()

  const sync = () => {
    for (const attr of Array.from(document.documentElement.attributes)) {
      if (target.documentElement.getAttribute(attr.name) !== attr.value) {
        target.documentElement.setAttribute(attr.name, attr.value)
      }
    }
    const sheets = [
      ...Array.from(document.styleSheets),
      ...Array.from(document.adoptedStyleSheets ?? []),
    ]
    for (const sheet of sheets) {
      const existing = copies.get(sheet)
      if (sheet.href) {
        if (!existing) {
          const link = target.createElement('link')
          link.rel = 'stylesheet'
          link.href = sheet.href
          target.head.append(link)
          copies.set(sheet, {el: link, rules: -1})
        }
        continue
      }
      let rules = 0
      try {
        rules = sheet.cssRules.length
      } catch {
        continue
      }
      if (existing && existing.rules === rules) continue
      const text = sheetText(sheet)
      if (text === null) continue
      if (existing) {
        existing.el.textContent = text
        existing.rules = rules
      } else {
        const style = target.createElement('style')
        style.textContent = text
        target.head.append(style)
        copies.set(sheet, {el: style, rules})
      }
    }
  }

  sync()
  const observer = new MutationObserver(sync)
  observer.observe(document.head, {childList: true, subtree: true, characterData: true})
  const timer = window.setInterval(sync, 500)
  return () => {
    observer.disconnect()
    window.clearInterval(timer)
  }
}

interface PipApi {
  requestWindow(options: {width: number; height: number}): Promise<Window>
}

/**
 * Open the panel in its own window: Document Picture-in-Picture where the browser has it (Chromium: a small
 * always-on-top window that can be moved to another screen), otherwise a pop-out window. The React tree stays in
 * this page (a portal), so it stays in sync with the app.
 */
async function openExternalWindow(size: {w: number; h: number}): Promise<Window | null> {
  const pip = (window as unknown as {documentPictureInPicture?: PipApi}).documentPictureInPicture
  let win: Window | null = null
  try {
    if (pip) win = await pip.requestWindow({width: size.w, height: size.h})
  } catch {
    win = null
  }
  // No Picture-in-Picture (or it was refused): a pop-out window instead.
  if (!win) win = window.open('', 'design-options', `popup,width=${size.w},height=${size.h}`)
  if (!win) return null
  win.document.title = getConfig().title ?? 'Design options'
  win.document.body.style.margin = '0'
  return win
}

/** The panel rendered into another window. Closing that window brings the panel back into the page. */
function ExternalWindow(props: {
  win: Window
  state: State
  onHide: () => void
  onBack: () => void
}) {
  const {win, state, onHide, onBack} = props
  useEffect(() => {
    const stopSync = startStyleSync(win.document)
    win.addEventListener('pagehide', onBack)
    return () => {
      stopSync()
      win.removeEventListener('pagehide', onBack)
    }
  }, [win, onBack])
  return createPortal(
    <Card style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
      <Flex align="center" gap={2} padding={2}>
        <Box flex={1}>
          <Text size={1} weight="medium">
            {getConfig().title ?? 'Design options'}
          </Text>
        </Box>
        <Button
          fontSize={0}
          mode="bleed"
          onClick={() => {
            win.close()
            onBack()
          }}
          padding={2}
          text="Bring back"
          title="Return the panel to the page"
        />
      </Flex>
      <ConfigBody onHide={onHide} state={state} />
    </Card>,
    win.document.body,
  )
}

// A floating window instead of a docked panel: dragged by its title bar, resized from the corner, position and
// size remembered. No scrim, so the studio under it stays interactive. Esc minimises it.
function ConfigWindow(props: {
  state: State
  onClose: () => void
  onHide: () => void
  onPopOut: (size: {w: number; h: number}) => void
}) {
  const {state, onClose, onHide, onPopOut} = props
  const [rect, setRect] = useState<Rect>(loadRect)
  const rectRef = useRef(rect)
  useLayoutEffect(() => {
    rectRef.current = rect
  })
  const frame = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{dx: number; dy: number} | null>(null)

  const save = useCallback((next: Rect) => {
    setRect(next)
    try {
      window.localStorage.setItem(WINDOW_KEY(), JSON.stringify(next))
    } catch {
      // Not remembered this time.
    }
  }, [])

  // Keep it inside the viewport when the browser window changes size.
  useEffect(() => {
    const onResize = () => setRect((r) => clampRect(r))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Remember a resize (the native corner handle changes the element size, not our state).
  useEffect(() => {
    const el = frame.current
    if (!el) return undefined
    const observer = new ResizeObserver(() => {
      const w = Math.round(el.offsetWidth)
      const h = Math.round(el.offsetHeight)
      if (w !== rectRef.current.w || h !== rectRef.current.h)
        save(clampRect({...rectRef.current, w, h}))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [save])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    drag.current = {dx: event.clientX - rect.x, dy: event.clientY - rect.y}
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    setRect(
      clampRect({
        ...rectRef.current,
        x: event.clientX - drag.current.dx,
        y: event.clientY - drag.current.dy,
      }),
    )
  }
  const onPointerUp = () => {
    if (!drag.current) return
    drag.current = null
    save(rectRef.current)
  }
  const onTitleKey = (event: KeyboardEvent) => {
    const step = event.shiftKey ? 64 : 16
    const move: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const delta = move[event.key]
    if (!delta) return
    event.preventDefault()
    save(clampRect({...rect, x: rect.x + delta[0], y: rect.y + delta[1]}))
  }

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape closes the dialog from anywhere inside it
    <div
      aria-label="Design options"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
      }}
      ref={frame}
      role="dialog"
      style={{
        height: rect.h,
        left: rect.x,
        maxHeight: window.innerHeight - 8,
        maxWidth: window.innerWidth - 8,
        minHeight: MIN_SIZE.h,
        minWidth: MIN_SIZE.w,
        overflow: 'hidden',
        position: 'fixed',
        resize: 'both',
        top: rect.y,
        width: rect.w,
        zIndex: 1000000,
      }}
    >
      <Card
        border
        radius={3}
        shadow={3}
        style={{
          background: SURFACE.window,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Flex
          align="center"
          gap={2}
          onKeyDown={onTitleKey}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          padding={2}
          style={{...SURFACE.band, cursor: 'grab', touchAction: 'none', userSelect: 'none'}}
          tabIndex={0}
        >
          <Text muted size={1}>
            <DragHandleIcon />
          </Text>
          <Box flex={1}>
            <Text size={1} weight="medium">
              Design options
            </Text>
          </Box>
          <Button
            aria-label="Pop out"
            icon={ArrowTopRightIcon}
            mode="bleed"
            onClick={() => onPopOut({w: rect.w, h: rect.h})}
            padding={2}
            style={{height: 25, width: 25}}
            title="Pop out: open in its own window, to move it to another screen"
          />
          <Button
            aria-label="Dock"
            icon={ArrowDownIcon}
            mode="bleed"
            onClick={() => save(dockedRect())}
            padding={2}
            style={{height: 25, width: 25}}
            title="Dock: back to the bottom left"
          />
          <Button
            aria-label="Minimise"
            icon={RemoveIcon}
            mode="bleed"
            onClick={onClose}
            padding={2}
            style={{height: 25, width: 25}}
            title="Minimise (Esc)"
          />
          <Button
            aria-label="Close"
            icon={CloseIcon}
            mode="bleed"
            onClick={onClose}
            padding={2}
            style={{height: 25, width: 25}}
          />
        </Flex>

        {/* The window floats at z-index 1000000; its menus open above it. */}
        <LayerProvider zOffset={1000001}>
          <ConfigBody
            compact={rect.w < 900}
            iconOnly={rect.w < 1100}
            onHide={onHide}
            state={state}
          />
        </LayerProvider>
      </Card>
    </div>
  )
}

// Floats over the Studio instead of taking layout space, so document heights stay real. Open or
// closed is per page load, and "hide" is deliberately not remembered: a refresh brings it back.
/** The collapsed control and the floating window. Mount once, anywhere in the app. */
const LAUNCHER_KEY = () => `${getConfig().storageKey}:launcher`

/**
 * The collapsed control. Drag the grip to move it anywhere in the window (the place is remembered); double-click the grip
 * to send it back to the bottom left. It sits above everything, so move it out of the way of the page you are reviewing.
 */
function Launcher({children}: {children: ReactNode}) {
  const [pos, setPos] = useState<{x: number; y: number} | null>(() => {
    try {
      const raw = window.localStorage.getItem(LAUNCHER_KEY())
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const drag = useRef<{dx: number; dy: number} | null>(null)
  const box = useRef<HTMLDivElement | null>(null)
  const clamp = (x: number, y: number) => ({
    x: Math.min(Math.max(x, 0), window.innerWidth - (box.current?.offsetWidth ?? 120)),
    y: Math.min(Math.max(y, 0), window.innerHeight - (box.current?.offsetHeight ?? 33)),
  })
  const save = (next: {x: number; y: number} | null) => {
    setPos(next)
    try {
      if (next) window.localStorage.setItem(LAUNCHER_KEY(), JSON.stringify(next))
      else window.localStorage.removeItem(LAUNCHER_KEY())
    } catch {
      // The place is not remembered this time.
    }
  }
  return (
    <div
      data-testid="options-launcher"
      ref={box}
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 2,
        position: 'fixed',
        zIndex: 1000000,
        ...(pos ? {left: pos.x, top: pos.y} : {bottom: 16, left: 16}),
      }}
    >
      <div
        aria-label="Drag handle"
        data-testid="options-grip"
        onDoubleClick={() => save(null)}
        onPointerDown={(event) => {
          const rect = box.current!.getBoundingClientRect()
          drag.current = {dx: event.clientX - rect.left, dy: event.clientY - rect.top}
          ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (drag.current)
            setPos(clamp(event.clientX - drag.current.dx, event.clientY - drag.current.dy))
        }}
        onPointerUp={(event) => {
          if (!drag.current) return
          const next = clamp(event.clientX - drag.current.dx, event.clientY - drag.current.dy)
          drag.current = null
          save(next)
        }}
        role="button"
        style={{
          background: 'var(--card-bg-color)',
          border: '1px solid var(--card-border-color)',
          borderRadius: 4,
          cursor: 'grab',
          height: 33,
          touchAction: 'none',
          width: 14,
        }}
        tabIndex={-1}
        title="Drag to move; double-click to reset"
      >
        <span
          aria-hidden
          style={{
            color: 'var(--card-muted-fg-color)',
            display: 'block',
            fontSize: 10,
            lineHeight: '31px',
            textAlign: 'center',
          }}
        >
          ⋮
        </span>
      </div>
      {children}
    </div>
  )
}

export function DesignOptions() {
  const state = useOptionState()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  // The global shape: one CSS variable that every Variants 2.0 pill and chip reads.
  useEffect(() => {
    const shape = getConfig().shape
    if (shape)
      document.documentElement.style.setProperty(
        shape.variable,
        state.shape === 'box' ? shape.box : shape.round,
      )
    if (shape)
      document.documentElement.style.setProperty(
        '--v2-pill-icon-pad',
        state.shape === 'box' ? '6px' : '12px',
      )
  }, [state.shape])
  const [external, setExternal] = useState<Window | null>(null)
  const controlRef = useRef<HTMLButtonElement | null>(null)

  const popOut = async (size: {w: number; h: number}) => {
    const win = await openExternalWindow(size)
    if (win) {
      setExternal(win)
      setOpen(false)
    }
  }
  const bringBack = () => {
    setExternal(null)
    setOpen(true)
  }

  const stock = state.global === 'stock'
  const changedCount = stock
    ? 0
    : getConfig().components.filter(
        (c) =>
          state.overrides[c.id] !== undefined && resolveOption(c, state) !== showOption(c, state),
      ).length
  const label = stock
    ? 'Stock'
    : changedCount > 0
      ? `Design options · ${changedCount} changed`
      : 'Design options'

  if (hidden) return null

  return (
    <>
      {external ? (
        <ExternalWindow
          onBack={bringBack}
          onHide={() => {
            external.close()
            setExternal(null)
            setHidden(true)
          }}
          state={state}
          win={external}
        />
      ) : null}
      {open && !external ? (
        <ConfigWindow
          onPopOut={(size) => void popOut(size)}
          onClose={() => {
            setOpen(false)
            controlRef.current?.focus()
          }}
          onHide={() => setHidden(true)}
          state={state}
        />
      ) : null}
      <Launcher>
        <Card radius={2} shadow={2}>
          <Button
            aria-expanded={open}
            aria-label="Design options"
            fontSize={1}
            icon={
              <span style={{alignItems: 'center', display: 'flex', height: 17}}>
                <StatusDot
                  color={stock ? 'default' : changedCount > 0 ? 'caution' : 'positive'}
                  title={
                    stock
                      ? 'Stock Studio'
                      : changedCount > 0
                        ? 'Some components differ from Show'
                        : 'Following Show'
                  }
                />
              </span>
            }
            mode="bleed"
            onClick={() => (external ? external.focus() : setOpen((v) => !v))}
            padding={2}
            ref={controlRef}
            text={label}
            title={summary(state)}
          />
        </Card>
      </Launcher>
    </>
  )
}
