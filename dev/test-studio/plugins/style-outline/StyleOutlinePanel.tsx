import {useEffect, useState} from 'react'

import {
  adoption,
  checkbox,
  cssMeter,
  cssMeterFill,
  dot,
  donut,
  donutValue,
  escapeCount,
  escapeCountValue,
  escapeDetails,
  group,
  groupHeading,
  header,
  legend,
  metricLabel,
  panel,
  root,
  row,
  rowCount,
  rowLabel,
  sectionDivider,
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

interface StyleSheetCounts {
  inaccessible: number
  styled: number
  total: number
}

interface Metrics {
  nodes: Counts
  stylesheets: StyleSheetCounts
}

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

function countStylesheetRules(): StyleSheetCounts {
  let inaccessible = 0
  let styled = 0
  let total = 0

  for (const sheet of document.styleSheets) {
    try {
      const ruleCount = sheet.cssRules.length
      total += ruleCount
      if (
        sheet.ownerNode instanceof HTMLStyleElement &&
        sheet.ownerNode.matches('style[data-styled]')
      ) {
        styled += ruleCount
      }
    } catch {
      inaccessible += 1
    }
  }

  return {inaccessible, styled, total}
}

function countMetrics(): Metrics {
  return {nodes: countNodes(), stylesheets: countStylesheetRules()}
}

function sameMetrics(a: Metrics | null, b: Metrics): boolean {
  return (
    a !== null &&
    STYLE_SYSTEMS.every((system) => a.nodes.get(system.id) === b.nodes.get(system.id)) &&
    a.stylesheets.inaccessible === b.stylesheets.inaccessible &&
    a.stylesheets.styled === b.stylesheets.styled &&
    a.stylesheets.total === b.stylesheets.total
  )
}

function percentage(part: number, total: number): number | null {
  return total === 0 ? null : Math.round((part / total) * 100)
}

function formatPercentage(value: number | null): string {
  return value === null ? '—' : `${value}%`
}

export default function StyleOutlinePanel() {
  const [state, setState] = useState(readStoredState)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
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
      const next = countMetrics()
      setMetrics((prev) => (sameMetrics(prev, next) ? prev : next))
    }
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(recount)
    }
    const bodyObserver = new MutationObserver(schedule)
    const headObserver = new MutationObserver(schedule)
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-ui'],
    })
    headObserver.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-styled', 'disabled', 'href', 'media', 'rel'],
    })
    document.addEventListener('load', schedule, true)
    schedule()
    return () => {
      bodyObserver.disconnect()
      headObserver.disconnect()
      document.removeEventListener('load', schedule, true)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [open])

  const ui5Count = metrics?.nodes.get('ui5') ?? 0
  const ui4Count = metrics?.nodes.get('ui4') ?? 0
  const styledCount = metrics?.nodes.get('styled')
  const uiTotal = ui5Count + ui4Count
  const ui5Percentage = percentage(ui5Count, uiTotal)
  const ui4Percentage = percentage(ui4Count, uiTotal)
  const styledRulePercentage = metrics
    ? percentage(metrics.stylesheets.styled, metrics.stylesheets.total)
    : null
  const toggleOpen = () => setState((prev) => ({...prev, open: !prev.open}))
  const toggleSystem = (id: StyleSystemId) =>
    setState((prev) => ({...prev, active: toggleId(prev.active, id)}))

  return (
    <div className={root} data-testid="style-outline">
      {open ? (
        <fieldset className={panel} aria-label="Style outline" data-testid="style-outline-panel">
          <button
            type="button"
            className={header}
            title="Collapse"
            aria-expanded
            onClick={toggleOpen}
            data-testid="style-outline-collapse"
          >
            Style migrations
          </button>
          <section className={group} aria-labelledby="style-outline-ui-adoption">
            <h2 className={groupHeading} id="style-outline-ui-adoption">
              UI v5 adoption
            </h2>
            <div className={adoption}>
              <div
                className={donut}
                style={{
                  background: `conic-gradient(${STYLE_SYSTEMS[0].color} ${
                    ui5Percentage ?? 0
                  }%, ${STYLE_SYSTEMS[1].color} 0)`,
                }}
                role="img"
                aria-label={`@sanity/ui v5 makes up ${formatPercentage(ui5Percentage)} of UI components`}
                data-testid="style-outline-ui-adoption-chart"
              >
                <span className={donutValue}>{formatPercentage(ui5Percentage)}</span>
              </div>
              <div className={legend}>
                <div className={row}>
                  <span className={dot} style={{background: STYLE_SYSTEMS[0].color}} />
                  <span className={rowLabel}>{STYLE_SYSTEMS[0].label}</span>
                  <span className={rowCount}>
                    {ui5Count.toLocaleString()} · {formatPercentage(ui5Percentage)}
                  </span>
                </div>
                <div className={row}>
                  <span className={dot} style={{background: STYLE_SYSTEMS[1].color}} />
                  <span className={rowLabel}>{STYLE_SYSTEMS[1].label}</span>
                  <span className={rowCount}>
                    {ui4Count.toLocaleString()} · {formatPercentage(ui4Percentage)}
                  </span>
                </div>
              </div>
            </div>
          </section>
          <div className={sectionDivider} />
          <section className={group} aria-labelledby="style-outline-styled-escape">
            <h2 className={groupHeading} id="style-outline-styled-escape">
              Styled-components escape
            </h2>
            <div className={escapeDetails}>
              <div className={escapeCount}>
                <span className={escapeCountValue}>
                  {styledCount === undefined ? '—' : styledCount.toLocaleString()}
                </span>
                <span className={metricLabel}>component instances</span>
              </div>
              <div
                className={rowCount}
                title={`${metrics?.stylesheets.inaccessible ?? 0} unreadable stylesheets`}
              >
                {formatPercentage(styledRulePercentage)} of readable CSS rules
              </div>
            </div>
            <div
              className={cssMeter}
              role="img"
              aria-label={`styled-components supplies ${formatPercentage(styledRulePercentage)} of readable CSS rules`}
              data-testid="style-outline-styled-rules-meter"
            >
              <span className={cssMeterFill} style={{width: `${styledRulePercentage ?? 0}%`}} />
            </div>
          </section>
          <div className={sectionDivider} />
          <section className={group} aria-labelledby="style-outline-debug">
            <h2 className={groupHeading} id="style-outline-debug">
              Debug outlines
            </h2>
            {STYLE_SYSTEMS.map((system) => (
              <label key={system.id} className={row}>
                <span className={dot} style={{background: system.color}} />
                <span className={rowLabel}>{system.label}</span>
                <input
                  type="checkbox"
                  className={checkbox}
                  checked={active.includes(system.id)}
                  onChange={() => toggleSystem(system.id)}
                  data-testid={`style-outline-toggle-${system.id}`}
                />
              </label>
            ))}
          </section>
        </fieldset>
      ) : (
        <button
          type="button"
          className={trigger}
          title="Style migrations"
          aria-label="Style migrations"
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
