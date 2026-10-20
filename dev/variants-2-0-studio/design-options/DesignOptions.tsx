import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CloseIcon} from '@sanity/icons/Close'
import {DragHandleIcon} from '@sanity/icons/DragHandle'
import {RemoveIcon} from '@sanity/icons/Remove'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {createPortal} from 'react-dom'
import {type KeyboardEvent, type ReactNode, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState} from 'react'

import {getConfig, NOT_DRAWN_LABEL} from './config'
import {OptionDiagram, SpecDiagram} from './diagram'
import {TAB_ID} from './tab'
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
  setStage,
  type State,
  useOptionState,
} from './store'
import type {ComponentDef, OptionDef} from './types'

const LETTERS = 'ABCDEFGH'
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

function StatusDot({color, title}: {color: 'positive' | 'suggest' | 'caution' | 'default'; title: string}) {
  return (
    <span
      aria-label={title}
      role="img"
      style={{
        background: color === 'default' ? 'var(--card-muted-fg-color)' : `var(--card-badge-${color}-dot-color)`,
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
    <Flex aria-label={ariaLabel} gap={1} onKeyDown={onKeyDown} role="radiogroup">
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <Box flex={fullWidth ? 1 : undefined} key={String(option.value)}>
            <Button
              aria-checked={selected}
              disabled={disabled || option.disabled}
              fontSize={1}
              mode={selected ? 'default' : 'ghost'}
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
  final: {word: 'decided', dot: 'positive'},
  candidate: {word: 'candidate', dot: 'suggest'},
  exploration: {word: 'exploration', dot: 'default'},
  'not-drawn': {word: 'not drawn', dot: 'default'},
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
      return Array.isArray(body) ? body.map((e: {id: string}) => e.id) : body ? (Object.keys(body) as string[]) : null
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

/** A Storybook link that cannot end on Storybook's error page: a missing story opens the nearest valid one, with a note. */
function StoryLink({id}: {id: string}) {
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
    <a
      data-moved={missing ? '' : undefined}
      data-testid="story-link"
      href={`${getConfig().links?.storybookBase}/?path=/story/${target}`}
      onClick={(e) => e.stopPropagation()}
      rel="noreferrer"
      style={{fontSize: 12}}
      target="_blank"
      title={missing ? 'Story moved: this opens the nearest story' : undefined}
    >
      Storybook{missing ? ' (moved)' : ''}
    </a>
  )
}

function OptionCard(props: {component: ComponentDef; option: OptionDef; letter: string; chosen: boolean; stock: boolean}) {
  const {component, option, letter, chosen, stock} = props
  const notDrawn = option.label === NOT_DRAWN
  const status = notDrawn ? {word: 'not drawn', dot: 'default' as Dot} : STATUS_WORD[option.status]
  const figma = figmaLinks(option.refs)[0]
  const entry = option.diagramKey ? getConfig().diagrams?.diagrams[option.diagramKey] : undefined
  const dashed = notDrawn || option.status === 'not-drawn'
  const border = chosen ? '2px solid var(--card-badge-suggest-dot-color)' : `1px ${dashed ? 'dashed' : 'solid'} var(--card-border-color)`
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
        background: 'var(--card-bg-color)',
        border,
        borderRadius: 6,
        cursor: notDrawn || stock ? 'default' : 'pointer',
        opacity: notDrawn || stock ? 0.6 : 1,
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
            {notDrawn ? 'No design for this option yet.' : (option.oneLiner ?? oneLine(option.summary))}
          </Text>
          <Flex align="center" gap={2} wrap="wrap">
            <StatusDot color={status.dot} title={status.word} />
            <Text muted size={0}>
              {status.word}
            </Text>
            <Box flex={1} />
            {figma ? (
              <a href={figma.href} onClick={(e) => e.stopPropagation()} rel="noreferrer" style={{fontSize: 12}} target="_blank">
                Figma
              </a>
            ) : null}
            {option.story ? <StoryLink id={option.story} /> : null}
          </Flex>
        </Stack>
      </Stack>
      {chosen ? (
        <span style={{color: 'var(--card-badge-suggest-dot-color)', position: 'absolute', right: 6, top: 4}}>
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
  const keys = component.options.flatMap((o) => (o.diagramKey ? [o.diagramKey, ...(o.frames ?? [])] : []))
  return [...new Set([...keys, ...(component.frames ?? [])])]
}

/** Every drawn frame of the component, with its status and caption (the same spec the tracker reads). */
function FramesGallery({component}: {component: ComponentDef}) {
  const file = getConfig().diagrams
  const entries = frameKeys(component).flatMap((key) => (file?.diagrams[key] ? [{key, entry: file.diagrams[key]}] : []))
  if (!entries.length) return null
  return (
    <Stack data-testid="frames-gallery" gap={2}>
      <Label>Frames</Label>
      <div style={{display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'}}>
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

function Label({children}: {children: string}) {
  return (
    <Text muted size={0} style={{letterSpacing: '0.04em', textTransform: 'uppercase'}} weight="medium">
      {children}
    </Text>
  )
}

function summary(state: State): string {
  const show = state.global === 'stock' ? 'Stock' : state.global === 'final' ? 'Final' : LETTERS[state.global]
  const lines = [`Show: ${show}`, `Stage: ${getConfig().scenario.stages.find((x) => x.id === state.stage)?.label ?? state.stage}`]
  if (state.global !== 'stock') {
    lines.push(
      getConfig().components.filter((c) => c.built)
        .map((c) => `${c.id.toUpperCase()} ${resolveOption(c, state).toUpperCase()}`)
        .join(' · '),
    )
  }
  return lines.join('\n')
}

function RailRow(props: {component: ComponentDef; state: State; selected: boolean; onSelect: () => void}) {
  const {component, state, selected, onSelect} = props
  const stock = state.global === 'stock'
  const active = resolveOption(component, state)
  const changed = !stock && state.overrides[component.id] !== undefined && active !== showOption(component, state)
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
          {component.id.toUpperCase()}
        </Text>
        <Box flex={1}>
          <Text size={1} textOverflow="ellipsis">
            {name}
          </Text>
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
          title={fallback ? `Show asks for a letter this component does not have: A, fallback` : `Option ${active.toUpperCase()}`}
        >
          {stock ? '–' : active.toUpperCase()}
          {fallback ? '*' : ''}
        </span>
      </Flex>
    </Card>
  )
}

/** Everything under the title bar: presets, Show and scenario, the rail, the option cards, the footer. */
function ConfigBody({state, onHide}: {state: State; onHide?: () => void}) {
  const [selectedId, setSelectedId] = useState('c1')
  const [copied, setCopied] = useState(false)
  const stock = state.global === 'stock'
  const selected = getConfig().components.find((c) => c.id === selectedId) ?? getConfig().components[0]
  const active = resolveOption(selected, state)
  const changedCount = getConfig().components.filter(
    (c) => state.overrides[c.id] !== undefined && resolveOption(c, state) !== showOption(c, state),
  ).length
  const maxChoices = maxOptionCount()
  const showOptions: SegmentOption<GlobalChoice>[] = [
    {value: 'stock', label: 'Stock', title: 'Stock Studio: every design slot renders what Studio does today'},
    ...Array.from({length: 5}, (_, index) => ({
      value: index as GlobalChoice,
      label: LETTERS[index],
      disabled: index >= maxChoices,
      title: index >= maxChoices ? 'No component has this option' : undefined,
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
        <Card borderBottom borderTop padding={3}>
          <Stack gap={3}>
          <PresetBar state={state} />
          <Flex align="center" gap={4} wrap="wrap">
            <Flex align="center" gap={2}>
              <Label>Show</Label>
              <Segmented ariaLabel="Show" onChange={(value) => setGlobalChoice(value)} options={showOptions} value={state.global} />
            </Flex>
            <Flex align="center" gap={2}>
              <Label>Stage</Label>
              <Segmented
                ariaLabel="Stage"
                onChange={(value) => setStage(value)}
                options={getConfig().scenario.stages.map((stage) => ({value: stage.id, label: stage.label}))}
                value={state.stage}
              />
            </Flex>
            {getConfig().scenario.dimensions && state.stage === getConfig().scenario.dimensionsStage ? (
              <Flex align="center" gap={2}>
                <Label>Dimensions</Label>
                <Segmented
                  ariaLabel="Dimensions"
                  onChange={(value) => setDimensionLimit(value)}
                  options={(getConfig().scenario.dimensions ?? []).map((d) => ({value: d.value, label: d.label, title: d.title}))}
                  value={state.dimensionLimit}
                />
              </Flex>
            ) : null}
          </Flex>
          </Stack>
        </Card>

        <Flex style={{flex: 1, minHeight: 0}}>
          <Box padding={2} style={{borderRight: '1px solid var(--card-border-color)', overflow: 'auto', width: 200}}>
            <Stack gap={3}>
              {getConfig().groups.map((group) => (
                <Stack gap={1} key={group.label}>
                  <Box paddingX={2}>
                    <Label>{group.label}</Label>
                  </Box>
                  {group.ids.map((id) => {
                    const component = getConfig().components.find((c) => c.id === id)
                    return component ? (
                      <RailRow component={component} key={id} onSelect={() => setSelectedId(id)} selected={id === selectedId} state={state} />
                    ) : null
                  })}
                </Stack>
              ))}
            </Stack>
          </Box>
          <Box flex={1} padding={3} style={{overflow: 'auto'}}>
            <Stack gap={3}>
              <Stack gap={1}>
                <Text size={1} weight="medium">
                  {selected.title}
                </Text>
                <Text muted size={0}>
                  {stock
                    ? 'Stock Studio is showing; pick A, B, C in Show to compare.'
                    : fellBack(selected, state)
                      ? `Showing ${active.toUpperCase()}, fallback: Show asks for a letter this component does not have.`
                      : `Showing option ${active.toUpperCase()}. Click a card to apply it.`}
                </Text>
              </Stack>
              <div
                role="radiogroup"
                style={{display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))'}}
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
              <FramesGallery component={selected} />
            </Stack>
          </Box>
        </Flex>

        <Card borderTop padding={2}>
          <Flex align="center" gap={2}>
            <Button disabled={changedCount === 0} fontSize={1} mode="bleed" onClick={resetOverrides} padding={2} text="Reset all" />
            <Box flex={1} />
            {getConfig().links?.storybookBase ? (
              <Text data-testid="storybook-base" muted size={0} title="Set SANITY_STUDIO_STORYBOOK_BASE to point the links elsewhere">
                Storybook: {getConfig().links?.storybookBase}
              </Text>
            ) : null}
            {getConfig().links?.remote ? (
              <Button fontSize={1} mode="bleed" onClick={() => window.open(`${getConfig().links!.remote}?tab=${TAB_ID}`, 'variants-2-0-options-remote', 'popup,width=520,height=820')} padding={2} text="Options remote" />
            ) : null}
            {getConfig().links?.remote ? (
              <Button fontSize={1} mode="bleed" onClick={() => window.open(`${getConfig().links!.journeysRemote}?tab=${TAB_ID}&storybook=${encodeURIComponent(getConfig().links?.storybookBase ?? '')}`, 'variants-2-0-remote', 'popup,width=1280,height=860')} padding={2} text="Journeys remote" />
            ) : null}
            <Button fontSize={1} mode="bleed" onClick={copy} padding={2} text={copied ? 'Copied' : 'Copy link'} />
            <Button fontSize={1} mode="bleed" onClick={onHide} padding={2} text="Hide until refresh" />
          </Flex>
        </Card>
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
    const sheets = [...Array.from(document.styleSheets), ...Array.from(document.adoptedStyleSheets ?? [])]
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
function ExternalWindow(props: {win: Window; state: State; onHide: () => void; onBack: () => void}) {
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
        <Button fontSize={0} mode="bleed" onClick={() => { win.close(); onBack() }} padding={2} text="Bring back" title="Return the panel to the page" />
      </Flex>
      <ConfigBody onHide={onHide} state={state} />
    </Card>,
    win.document.body,
  )
}

// A floating window instead of a docked panel: dragged by its title bar, resized from the corner, position and
// size remembered. No scrim, so the studio under it stays interactive. Esc minimises it.
function ConfigWindow(props: {state: State; onClose: () => void; onHide: () => void; onPopOut: (size: {w: number; h: number}) => void}) {
  const {state, onClose, onHide, onPopOut} = props
  const [rect, setRect] = useState<Rect>(loadRect)
  const rectRef = useRef(rect)
  rectRef.current = rect
  const frame = useRef<HTMLDivElement | null>(null)
  const drag = useRef<{dx: number; dy: number} | null>(null)

  const save = (next: Rect) => {
    setRect(next)
    try {
      window.localStorage.setItem(WINDOW_KEY(), JSON.stringify(next))
    } catch {
      // Not remembered this time.
    }
  }

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
      if (w !== rectRef.current.w || h !== rectRef.current.h) save(clampRect({...rectRef.current, w, h}))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    drag.current = {dx: event.clientX - rect.x, dy: event.clientY - rect.y}
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    setRect(clampRect({...rectRef.current, x: event.clientX - drag.current.dx, y: event.clientY - drag.current.dy}))
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
      <Card border radius={3} shadow={3} style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
        <Flex
          align="center"
          gap={2}
          onKeyDown={onTitleKey}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          padding={2}
          style={{cursor: 'grab', touchAction: 'none', userSelect: 'none'}}
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
          <Button fontSize={0} mode="bleed" onClick={() => onPopOut({w: rect.w, h: rect.h})} padding={2} text="Pop out" title="Open in its own window: move it to another screen" />
          <Button fontSize={0} mode="bleed" onClick={() => save(dockedRect())} padding={2} text="Dock" title="Back to the bottom left" />
          <Button aria-label="Minimise" icon={RemoveIcon} mode="bleed" onClick={onClose} padding={2} style={{height: 25, width: 25}} title="Minimise (Esc)" />
          <Button aria-label="Close" icon={CloseIcon} mode="bleed" onClick={onClose} padding={2} style={{height: 25, width: 25}} />
        </Flex>

        <ConfigBody onHide={onHide} state={state} />
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
      style={{alignItems: 'center', display: 'flex', gap: 2, position: 'fixed', zIndex: 1000000, ...(pos ? {left: pos.x, top: pos.y} : {bottom: 16, left: 16})}}
    >
      <div
        aria-label="Drag handle" data-testid="options-grip"
        onDoubleClick={() => save(null)}
        onPointerDown={(event) => {
          const rect = box.current!.getBoundingClientRect()
          drag.current = {dx: event.clientX - rect.left, dy: event.clientY - rect.top}
          ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (drag.current) setPos(clamp(event.clientX - drag.current.dx, event.clientY - drag.current.dy))
        }}
        onPointerUp={(event) => {
          if (!drag.current) return
          const next = clamp(event.clientX - drag.current.dx, event.clientY - drag.current.dy)
          drag.current = null
          save(next)
        }}
        role="button"
        style={{background: 'var(--card-bg-color)', border: '1px solid var(--card-border-color)', borderRadius: 4, cursor: 'grab', height: 33, touchAction: 'none', width: 14}}
        tabIndex={-1}
        title="Drag to move; double-click to reset"
      >
        <span aria-hidden style={{color: 'var(--card-muted-fg-color)', display: 'block', fontSize: 10, lineHeight: '31px', textAlign: 'center'}}>⋮</span>
      </div>
      {children}
    </div>
  )
}

export function DesignOptions() {
  const state = useOptionState()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
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
        (c) => state.overrides[c.id] !== undefined && resolveOption(c, state) !== showOption(c, state),
      ).length
  const label = stock ? 'Stock' : changedCount > 0 ? `Design options · ${changedCount} changed` : 'Design options'

  if (hidden) return null

  return (
    <>
      {external ? <ExternalWindow onBack={bringBack} onHide={() => { external.close(); setExternal(null); setHidden(true) }} state={state} win={external} /> : null}
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
                  title={stock ? 'Stock Studio' : changedCount > 0 ? 'Some components differ from Show' : 'Following Show'}
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

