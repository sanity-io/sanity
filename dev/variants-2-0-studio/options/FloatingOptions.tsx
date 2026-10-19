import {CloseIcon} from '@sanity/icons/Close'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {type KeyboardEvent, useRef, useState} from 'react'
import {type LayoutProps, PerspectiveMenuExtensionProvider} from 'sanity'
import {DocumentListItemOverrideProvider, DocumentPaneExtensionProvider} from 'sanity/structure'

import {PerspectiveProvider} from '../c1/state'
import {useOptionAExtension} from '../c1/Controls'
import {useRowOverride} from '../c3/RowOverride'
import {useDocumentPaneOverride} from '../pane/useDocumentPaneOverride'
import {type ComponentDef, COMPONENTS} from './registry'
import {
  designLink,
  type GlobalChoice,
  resetOverrides,
  resolveOption,
  setDimensionLimit,
  setGlobalChoice,
  setOverride,
  setStage,
  type State,
  useOptionState,
} from './store'

const LETTERS = 'ABCDEFGH'
const FIGMA_FILE = 'https://www.figma.com/design/C1T4EUScc9PMf5tqNo09Qs'

// Groups follow DESIGN-STUDIO-CONFIG-SPEC.md: where in the studio the component lives.
const GROUPS: {label: string; ids: string[]}[] = [
  {label: 'Studio chrome', ids: ['c1', 'c2', 'c3']},
  {label: 'Inventory', ids: ['c4', 'c5', 'c6']},
  {label: 'Document', ids: ['c7']},
  {label: 'Releases', ids: ['c8']},
]

const NOT_DRAWN = 'Not drawn'

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

function figmaLinks(refs: string | undefined): {label: string; href: string}[] {
  if (!refs) return []
  return [...refs.matchAll(/(\d+):(\d+)/g)].map((m) => ({
    label: `Figma ${m[1]}:${m[2]}`,
    href: `${FIGMA_FILE}?node-id=${m[1]}-${m[2]}`,
  }))
}

/** What "Show" alone would give this component, so a per-component choice can be marked as changed. */
function showOption(component: ComponentDef, state: State): string {
  return resolveOption(component, {...state, overrides: {}})
}

function ComponentRow({component, state}: {component: ComponentDef; state: State}) {
  const [expanded, setExpanded] = useState(false)
  const stock = state.global === 'stock'
  const active = resolveOption(component, state)
  const base = showOption(component, state)
  const changed = !stock && state.overrides[component.id] !== undefined && active !== base
  const activeOption = component.options.find((option) => option.id === active)
  const code = component.id.toUpperCase()
  const name = component.title.replace(new RegExp(`^${code}\\s*`), '')
  const links = figmaLinks(activeOption?.refs)

  return (
    <Stack gap={1} style={{opacity: stock ? 0.5 : 1}}>
      <Flex align="center" gap={2} style={{minHeight: 33}}>
        <Box flex={1}>
          <button
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            style={{
              alignItems: 'baseline',
              background: 'none',
              border: 0,
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              font: 'inherit',
              gap: 8,
              padding: 0,
              textAlign: 'left',
            }}
            type="button"
          >
            <Text muted size={0}>
              {code}
            </Text>
            <Text size={1}>{name}</Text>
            {changed ? <StatusDot color="caution" title="Differs from Show" /> : null}
          </button>
        </Box>
        <Segmented
          ariaLabel={`${component.title} option`}
          disabled={stock}
          onChange={(id: string) => setOverride(component.id, id === base ? null : id)}
          options={component.options.map((option, index) => ({
            value: option.id,
            label: LETTERS[index],
            disabled: option.label === NOT_DRAWN,
            title: option.label === NOT_DRAWN ? 'Not drawn yet' : option.label,
          }))}
          value={active}
        />
        <StatusDot
          color={statusOf(component)}
          title={{positive: 'Decided', suggest: 'Candidate', default: 'Not drawn'}[statusOf(component)]}
        />
      </Flex>
      {expanded ? (
        <Flex align="center" gap={3} paddingBottom={2} wrap="wrap">
          <Text muted size={0}>
            {stock ? 'Stock Studio' : `Option ${active.toUpperCase()} · ${activeOption?.label ?? ''}`}
          </Text>
          {links.map((link) => (
            <a href={link.href} key={link.href} rel="noreferrer" style={{fontSize: 12}} target="_blank">
              {link.label}
            </a>
          ))}
          {changed ? (
            <Button fontSize={0} mode="bleed" onClick={() => setOverride(component.id, null)} padding={1} text="Reset to Show" />
          ) : null}
        </Flex>
      ) : null}
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
  const lines = [`Show: ${show}`, `Stage: ${state.stage === 'open-beta' ? 'Open beta' : 'GA'}`]
  if (state.global !== 'stock') {
    lines.push(
      COMPONENTS.filter((c) => c.built)
        .map((c) => `${c.id.toUpperCase()} ${resolveOption(c, state).toUpperCase()}`)
        .join(' · '),
    )
  }
  return lines.join('\n')
}

// Floats over the Studio instead of taking layout space, so document heights stay real. Open or
// closed is per page load, and "hide" is deliberately not remembered: a refresh brings it back.
function FloatingOptions() {
  const state = useOptionState()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [copied, setCopied] = useState(false)
  const controlRef = useRef<HTMLButtonElement | null>(null)

  const stock = state.global === 'stock'
  const changedCount = stock
    ? 0
    : COMPONENTS.filter(
        (c) => state.overrides[c.id] !== undefined && resolveOption(c, state) !== showOption(c, state),
      ).length
  const label = stock ? 'Stock' : changedCount > 0 ? `Design options · ${changedCount} changed` : 'Design options'

  const maxChoices = Math.max(...COMPONENTS.map((c) => c.options.length))
  const showOptions: SegmentOption<GlobalChoice>[] = [
    {value: 'stock', label: 'Stock', title: 'Stock Studio: every design slot renders what Studio does today'},
    ...Array.from({length: maxChoices}, (_, index) => ({value: index as GlobalChoice, label: LETTERS[index]})),
    {value: 'final', label: 'Final', title: 'Each component\'s signed-off option'},
  ]

  if (hidden) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(designLink())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked; the link is in the address bar after a reload anyway.
    }
  }

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          controlRef.current?.focus()
        }
      }}
      style={{
        alignItems: 'flex-start',
        bottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        left: 16,
        position: 'fixed',
        zIndex: 1000000,
      }}
    >
      {open ? (
        <Card radius={3} shadow={3} style={{display: 'flex', flexDirection: 'column', maxHeight: 560, overflow: 'hidden', width: 360}}>
          <Stack gap={4} padding={3} style={{flex: 1, minHeight: 0, overflow: 'auto'}}>
            <Flex align="center" gap={2}>
              <Box flex={1}>
                <Stack gap={1}>
                  <Text size={1} weight="medium">
                    Design options
                  </Text>
                  <Text muted size={0}>
                    Changes apply at once.
                  </Text>
                </Stack>
              </Box>
              <Button aria-label="Close" icon={CloseIcon} mode="bleed" onClick={() => setOpen(false)} padding={2} style={{height: 25, width: 25}} />
            </Flex>

            <Stack gap={2}>
              <Label>Show</Label>
              <Segmented
                ariaLabel="Show"
                fullWidth
                onChange={(value) => setGlobalChoice(value)}
                options={showOptions}
                value={state.global}
              />
            </Stack>

            <Stack gap={2}>
              <Label>Scenario</Label>
              <Flex align="center" gap={2}>
                <Box style={{width: 88}}>
                  <Text muted size={1}>
                    Stage
                  </Text>
                </Box>
                <Segmented
                  ariaLabel="Stage"
                  onChange={(value) => setStage(value)}
                  options={[
                    {value: 'open-beta' as const, label: 'Open beta'},
                    {value: 'ga' as const, label: 'GA'},
                  ]}
                  value={state.stage}
                />
              </Flex>
              {state.stage === 'ga' ? (
                <Flex align="center" gap={2}>
                  <Box style={{width: 88}}>
                    <Text muted size={1}>
                      Dimensions
                    </Text>
                  </Box>
                  <Segmented
                    ariaLabel="Dimensions"
                    onChange={(value) => setDimensionLimit(value)}
                    options={[
                      {value: null, label: 'All', title: 'Show every dimension'},
                      {value: 1, label: '1', title: 'One list'},
                      {value: 2, label: '2', title: 'Two columns'},
                      {value: 5, label: '5', title: 'Five and more: the rail'},
                    ]}
                    value={state.dimensionLimit}
                  />
                </Flex>
              ) : null}
            </Stack>

            <Stack gap={3}>
              <Label>Components</Label>
              {GROUPS.map((group) => (
                <Stack gap={1} key={group.label}>
                  <Text muted size={0}>
                    {group.label}
                  </Text>
                  {group.ids.map((id) => {
                    const component = COMPONENTS.find((c) => c.id === id)
                    return component ? <ComponentRow component={component} key={id} state={state} /> : null
                  })}
                </Stack>
              ))}
            </Stack>

          </Stack>
          <Card borderTop padding={2}>
            <Flex align="center" gap={2}>
              <Button disabled={changedCount === 0} fontSize={1} mode="bleed" onClick={resetOverrides} padding={2} text="Reset all" />
              <Box flex={1} />
              <Button fontSize={1} mode="bleed" onClick={copy} padding={2} text={copied ? 'Copied' : 'Copy link'} />
              <Button fontSize={1} mode="bleed" onClick={() => setHidden(true)} padding={2} text="Hide until refresh" />
            </Flex>
          </Card>
        </Card>
      ) : null}

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
          onClick={() => setOpen((v) => !v)}
          padding={2}
          ref={controlRef}
          text={label}
          title={summary(state)}
        />
      </Card>
    </div>
  )
}

export function LayoutWithFloatingOptions(props: LayoutProps) {
  return (
    <DocumentListItemOverrideProvider value={useRowOverride}>
      <PerspectiveProvider>
        <PerspectiveMenuExtensionProvider value={useOptionAExtension}>
          <DocumentPaneExtensionProvider value={useDocumentPaneOverride}>
            {props.renderDefault(props)}
            <FloatingOptions />
          </DocumentPaneExtensionProvider>
        </PerspectiveMenuExtensionProvider>
      </PerspectiveProvider>
    </DocumentListItemOverrideProvider>
  )
}
