import {css} from '#styled-system/css'

/** The Changes and History panel: the dialog's third column, beside the Comparing with side. */
export const comparisonChangesPanel = css({
  gridArea: 'changes-panel',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
  borderLeft: '1px solid var(--card-border-color)',
})

export const comparisonChangesPanelTabs = css({
  display: 'flex',
  gap: '4px',
  padding: '8px 12px',
  borderBottom: '1px solid var(--card-border-color)',
  flex: 'none',
})

export const comparisonChangesPanelBody = css({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: '12px',
})
