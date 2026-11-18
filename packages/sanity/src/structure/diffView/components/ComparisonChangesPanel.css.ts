import {css} from '#styled-system/css'

/** The History and Review changes panel: the dialog's third column, beside the Comparing with side. */
export const comparisonChangesPanel = css({
  gridArea: 'changes-panel',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
  borderLeft: '1px solid var(--card-border-color)',
})
