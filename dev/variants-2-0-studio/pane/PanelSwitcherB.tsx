import {Text} from '@sanity/ui'

import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {useInspectorPanels} from './inspectorPanels'

// Inspector switcher B: the panels are icons in the pane header (just before "..."), and the inspector has a plain title row instead of tabs.
// Versions is not one of the icons: the "<title> · N versions" pill is its way in. A second click on the open panel's icon closes it.

/** History, Review changes, References and Comments as 25 px tertiary icon buttons, then a thin divider. */
export function HeaderPanelButtons() {
  const {panels, close} = useInspectorPanels()
  const icons = panels.filter((p) => p.id !== 'versions')
  if (icons.length === 0) return null
  return (
    <>
      {icons.map((panel) => (
        <Button
          aria-label={panel.title}
          data-testid={`header-panel-${panel.id}`}
          icon={panel.icon}
          key={panel.id}
          mode="bleed"
          onClick={panel.active ? close : panel.select}
          selected={panel.active}
          tooltipProps={{content: panel.title}}
        />
      ))}
      <span
        aria-hidden="true"
        data-testid="header-panel-divider"
        style={{
          background: 'var(--card-border-color)',
          flex: 'none',
          height: 16,
          margin: '0 4px',
          width: 1,
        }}
      />
    </>
  )
}

/** The inspector's title row: 13 px semibold, 20 px at the sides, 41 px tall. */
export function PanelTitleRow() {
  const {panels} = useInspectorPanels()
  const open = panels.find((p) => p.active)
  return (
    <div
      data-testid="inspector-title-row"
      style={{alignItems: 'center', display: 'flex', height: 41, padding: '0 20px'}}
    >
      <Text size={1} weight="semibold">
        {open?.title ?? ''}
      </Text>
    </div>
  )
}
