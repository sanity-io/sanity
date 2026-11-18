import {css} from '#styled-system/css'

/**
 * The History and Review changes panel: the dialog's third column, beside the Comparing with side.
 * Its diffs show what was added in green and what was removed in red, instead of the author's
 * colour. The colours come from custom properties the panel sets for the colour scheme; the
 * attribute selectors outrank the card's own colour class.
 */
export const comparisonChangesPanel = css({
  'gridArea': 'changes-panel',
  'display': 'flex',
  'flexDirection': 'column',
  'minHeight': 0,
  'minWidth': 0,
  'borderLeft': '1px solid var(--card-border-color)',

  '& [data-ui="diff-card"]': {
    backgroundColor: 'var(--comparison-added-bg)',
    color: 'var(--comparison-added-fg)',
  },

  '& del[data-ui="diff-card"]': {
    backgroundColor: 'var(--comparison-removed-bg)',
    color: 'var(--comparison-removed-fg)',
  },
})
