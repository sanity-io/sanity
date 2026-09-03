import {useEffect, useState} from 'react'

import {
  checkbox,
  collapse,
  dot,
  header,
  panel,
  root,
  row,
  rowCount,
  rowLabel,
  trigger,
} from './styleOutline.css'
import {
  STYLE_OUTLINE_ATTRIBUTE,
  STYLE_OUTLINE_STORAGE_KEY,
  STYLE_SYSTEMS,
  type StyleSystemId,
} from './styleSystems'

interface PanelState {
  open: boolean
  active: StyleSystemId[]
}

type Counts = ReadonlyMap<StyleSystemId, number>

const DEFAULT_STATE: PanelState = {open: false, active: []}

function isStyleSystemId(value: unknown): value is StyleSystemId {
  return STYLE_SYSTEMS.some((system) => system.id === value)
}

function inRegistryOrder(ids: ReadonlySet<StyleSystemId>): StyleSystemId[] {
  return STYLE_SYSTEMS.filter((system) => ids.has(system.id)).map((system) => system.id)
}

function readStoredState(): PanelState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STYLE_OUTLINE_STORAGE_KEY) ?? 'null')
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_STATE
    if (!('open' in parsed) || !('active' in parsed)) return DEFAULT_STATE
    const {open, active} = parsed
    if (typeof open !== 'boolean' || !Array.isArray(active)) return DEFAULT_STATE
    const ids: unknown[] = active
    return {open, active: inRegistryOrder(new Set(ids.filter(isStyleSystemId)))}
  } catch {
    return DEFAULT_STATE
  }
}

function writeStoredState(state: PanelState): void {
  try {
    localStorage.setItem(STYLE_OUTLINE_STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function toggleId(active: StyleSystemId[], id: StyleSystemId): StyleSystemId[] {
  const next = new Set(active)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return inRegistryOrder(next)
}

function countNodes(): Counts {
  return new Map(
    STYLE_SYSTEMS.map((system): [StyleSystemId, number] => [
      system.id,
      document.querySelectorAll(system.selector).length,
    ]),
  )
}

function sameCounts(a: Counts | null, b: Counts): boolean {
  return a !== null && STYLE_SYSTEMS.every((system) => a.get(system.id) === b.get(system.id))
}

function formatCount(count: number | undefined, total: number): string {
  if (count === undefined || total === 0) return '—'
  return `${count.toLocaleString()} · ${Math.round((count / total) * 100)}%`
}

export function StyleOutlinePanel() {
  const [state, setState] = useState(readStoredState)
  const [counts, setCounts] = useState<Counts | null>(null)
  const {open, active} = state

  useEffect(() => {
    writeStoredState(state)
  }, [state])

  useEffect(() => {
    const html = document.documentElement
    if (active.length > 0) html.setAttribute(STYLE_OUTLINE_ATTRIBUTE, active.join(' '))
    else html.removeAttribute(STYLE_OUTLINE_ATTRIBUTE)
    return () => html.removeAttribute(STYLE_OUTLINE_ATTRIBUTE)
  }, [active])

  useEffect(() => {
    if (!open) return undefined
    let frame: number | null = null
    const recount = () => {
      frame = null
      const next = countNodes()
      setCounts((prev) => (sameCounts(prev, next) ? prev : next))
    }
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(recount)
    }
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-ui'],
    })
    schedule()
    return () => {
      observer.disconnect()
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [open])

  const total = counts
    ? STYLE_SYSTEMS.reduce((sum, system) => sum + (counts.get(system.id) ?? 0), 0)
    : 0
  const toggleOpen = () => setState((prev) => ({...prev, open: !prev.open}))
  const toggleSystem = (id: StyleSystemId) =>
    setState((prev) => ({...prev, active: toggleId(prev.active, id)}))

  return (
    <div className={root} data-testid="style-outline">
      {open ? (
        <fieldset className={panel} aria-label="Style outline" data-testid="style-outline-panel">
          <div className={header}>
            <span>Style outline</span>
            <button
              type="button"
              className={collapse}
              aria-label="Hide style outline"
              onClick={toggleOpen}
              data-testid="style-outline-collapse"
            >
              ×
            </button>
          </div>
          {STYLE_SYSTEMS.map((system) => (
            <label key={system.id} className={row}>
              <span className={dot} style={{background: system.color}} />
              <span className={rowLabel}>{system.label}</span>
              <span className={rowCount}>{formatCount(counts?.get(system.id), total)}</span>
              <input
                type="checkbox"
                className={checkbox}
                checked={active.includes(system.id)}
                onChange={() => toggleSystem(system.id)}
                style={{accentColor: system.color}}
                data-testid={`style-outline-toggle-${system.id}`}
              />
            </label>
          ))}
        </fieldset>
      ) : (
        <button
          type="button"
          className={trigger}
          title="Style outline"
          aria-label="Show style outline"
          aria-expanded={false}
          onClick={toggleOpen}
          data-testid="style-outline-trigger"
        >
          {STYLE_SYSTEMS.map((system) => (
            <span
              key={system.id}
              className={dot}
              style={{background: system.color, opacity: active.includes(system.id) ? 1 : 0.3}}
            />
          ))}
        </button>
      )}
    </div>
  )
}
