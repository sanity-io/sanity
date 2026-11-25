import {css} from '#styled-system/css'

// The changes carry no attribution, so their diff cards don't get an author's color: additions
// and removals get their own instead. A card is the `ins`/`del` itself (from/to values) or wraps
// one (string segments).
export const editEventChanges = css({
  '& [data-ui="diff-card"]:is(ins, :has(> ins))': {
    backgroundColor: 'var(--card-badge-positive-bg-color)',
    color: 'var(--card-badge-positive-fg-color)',
  },
  '& [data-ui="diff-card"]:is(del, :has(> del))': {
    backgroundColor: 'var(--card-badge-critical-bg-color)',
    color: 'var(--card-badge-critical-fg-color)',
  },
  '& [data-ui="diff-card"] > :is(ins, del)': {
    color: 'inherit',
  },
})
