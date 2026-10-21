import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {Menu} from '@sanity/ui/menu'
import {useState} from 'react'

import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
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

function Tab({panel, narrow}: {panel: Panel; narrow: boolean}) {
  const Icon = panel.icon
  const showTitle = !narrow || panel.active
  return (
    <button
      aria-selected={panel.active}
      data-testid={`inspector-tab-${panel.id}`}
      onClick={panel.select}
      role="tab"
      style={{
        alignItems: 'center',
        background: panel.active ? 'var(--card-bg-color)' : 'transparent',
        border: 0,
        borderRadius: 6,
        boxShadow: panel.active ? '0 1px 3px rgba(0, 0, 0, 0.14)' : 'none',
        color: panel.active ? 'var(--card-fg-color)' : 'var(--card-muted-fg-color)',
        cursor: 'pointer',
        display: 'inline-flex',
        flex: showTitle && !narrow ? '0 0 auto' : narrow && !panel.active ? '1 1 0%' : '0 0 auto',
        font: 'inherit',
        fontSize: 13,
        fontWeight: panel.active ? 600 : 500,
        gap: 6,
        height: 29,
        justifyContent: 'center',
        minWidth: 29,
        padding: showTitle ? '0 10px' : '0 6px',
        whiteSpace: 'nowrap',
      }}
      title={panel.title}
      type="button"
    >
      <span style={{display: 'inline-flex', fontSize: 25, margin: -4}}>
        <Icon />
      </span>
      {showTitle ? panel.title : null}
      {panel.count ? <Count n={panel.count} /> : null}
    </button>
  )
}

export function InspectorTabs() {
  const {panels} = useInspectorPanels()
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
