import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {Menu} from '@sanity/ui/menu'
import {startTransition, useState} from 'react'

import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {Tooltip} from '../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {type Panel, useInspectorPanels} from './inspectorPanels'

// The inspector's one tab row (spec I1 to I3): contained tabs on a grey track, radius 8, padding Space/1; the open tab is a white chip with a soft
// shadow and a semibold title, the others are muted; no line under the row. From 590 px every tab shows its icon and title; narrower, the open tab
// keeps its title and the others become equal icon segments with tooltips. More than 8 tabs: the last ones go into "More (n)" (Versions never does).

const TRACK = 'var(--card-badge-default-bg-color)'
const WIDE = 590
const MAX_TABS = 8

function Count({n}: {n: number}) {
  return (
    <span
      style={{
        background: 'var(--card-badge-default-bg-color)',
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: '16px',
        minWidth: 16,
        padding: '0 4px',
        textAlign: 'center',
      }}
    >
      {n}
    </span>
  )
}

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const MOTION = `320ms ${EASE}`

/**
 * One tab. While the track is narrow the tabs share its width: the open tab takes a larger share and shows its title, the others are equal icon
 * segments. The share (flex-grow) and the title's opacity animate, so a switch slides instead of jumping and no icon changes row or height.
 */
function Tab({panel, narrow}: {panel: Panel; narrow: boolean}) {
  const Icon = panel.icon
  return (
    <Tooltip content={panel.title} placement="bottom" portal>
      <button
        aria-label={panel.title}
        aria-selected={panel.active}
        data-testid={`inspector-tab-${panel.id}`}
        onClick={panel.select}
        role="tab"
        style={{
          alignItems: 'center',
          background: panel.active ? 'var(--card-bg-color)' : 'transparent',
          border: 0,
          borderRadius: 6,
          boxShadow: panel.active ? '0 1px 3px rgba(0, 0, 0, 0.14)' : '0 1px 3px rgba(0, 0, 0, 0)',
          color: panel.active ? 'var(--card-fg-color)' : 'var(--card-muted-fg-color)',
          cursor: 'pointer',
          display: 'inline-flex',
          flex: narrow ? (panel.active ? '3.2 1 0%' : '1 1 0%') : '0 0 auto',
          font: 'inherit',
          fontSize: 13,
          fontWeight: panel.active ? 600 : 500,
          height: 29,
          justifyContent: 'center',
          minWidth: 29,
          overflow: 'hidden',
          padding: '0 8px',
          transition: `flex-grow ${MOTION}, background-color ${MOTION}, box-shadow ${MOTION}, color ${MOTION}`,
          whiteSpace: 'nowrap',
        }}
        type="button"
      >
        <span style={{display: 'inline-flex', flex: 'none', fontSize: 25, margin: -4}}>
          <Icon />
        </span>
        <span
          style={{
            // Hidden titles keep no width, so an icon-only tab stays an icon-only tab.
            maxWidth: !narrow || panel.active ? 160 : 0,
            marginLeft: !narrow || panel.active ? 6 : 0,
            opacity: !narrow || panel.active ? 1 : 0,
            overflow: 'hidden',
            transition: `max-width ${MOTION}, margin-left ${MOTION}, opacity 160ms ease`,
          }}
        >
          {panel.title}
        </span>
        {panel.count ? (
          <span style={{marginLeft: 6}}>
            <Count n={panel.count} />
          </span>
        ) : null}
      </button>
    </Tooltip>
  )
}

export function InspectorTabs() {
  const {panels: real} = useInspectorPanels()
  // The row answers in the same frame: the chosen tab is marked at once, and the panel mounts in a transition behind it (a heavy panel would
  // otherwise hold the whole row for a few frames before it moved).
  const [pending, setPending] = useState<{id: string; from: string | undefined} | null>(null)
  const realActive = real.find((p) => p.active)?.id
  // Shown only until the real state moves off where it was when the tab was chosen.
  const chosen = pending && realActive === pending.from ? pending.id : undefined
  const panels = real.map((panel) => ({
    ...panel,
    active: chosen ? panel.id === chosen : panel.active,
    select: () => {
      setPending({id: panel.id, from: realActive})
      // Let the row paint its answer before the panel mounts: the mount holds the main thread for a few frames.
      requestAnimationFrame(() => setTimeout(() => startTransition(() => panel.select()), 0))
      setTimeout(() => setPending(null), 2000)
    },
  }))
  const [width, setWidth] = useState(WIDE)
  const narrow = width < WIDE
  const overflow = panels.length > MAX_TABS ? panels.slice(MAX_TABS - 1) : []
  const shown = overflow.length ? panels.slice(0, MAX_TABS - 1) : panels

  return (
    <div
      data-testid="inspector-tabs"
      ref={(el) => {
        if (!el) return undefined
        const observer = new ResizeObserver(() => setWidth(el.getBoundingClientRect().width))
        observer.observe(el)
        return () => observer.disconnect()
      }}
      style={{padding: 12}}
    >
      <div
        role="tablist"
        style={{
          alignItems: 'center',
          background: TRACK,
          borderRadius: 8,
          display: 'flex',
          gap: 2,
          padding: 4,
          transition: 'none',
        }}
      >
        {shown.map((panel) => (
          <Tab key={panel.id} narrow={narrow} panel={panel} />
        ))}
        {overflow.length ? (
          <MenuButton
            button={
              <button
                data-testid="inspector-tabs-more"
                style={{
                  background: overflow.some((p) => p.active)
                    ? 'var(--card-bg-color)'
                    : 'transparent',
                  border: 0,
                  borderRadius: 6,
                  color: 'var(--card-muted-fg-color)',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: 13,
                  height: 29,
                  padding: '0 10px',
                }}
                type="button"
              >
                More ({overflow.length})
              </button>
            }
            id="inspector-tabs-more"
            menu={
              <Menu>
                {overflow.map((panel) => (
                  <MenuItem
                    icon={EllipsisHorizontalIcon}
                    key={panel.id}
                    onClick={panel.select}
                    pressed={panel.active}
                    text={panel.title}
                  />
                ))}
              </Menu>
            }
            popover={{placement: 'bottom-end', portal: true}}
          />
        ) : null}
      </div>
    </div>
  )
}
