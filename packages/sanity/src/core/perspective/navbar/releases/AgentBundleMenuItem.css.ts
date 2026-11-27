import {css} from '#styled-system/css'

/**
 * The sparkle keeps the suggestion accent while the row is idle. A highlighted row (hovered,
 * keyboard active or selected) swaps the card tone, so the icon follows `--card-icon-color`
 * like the release rows' icons do instead of staying accent-on-accent.
 */
export const agentBundleIcon = css({
  '&&': {
    '--icon-color': 'var(--card-badge-suggest-icon-color)',
    'margin': '-0.375rem',
  },
  '[data-ui="MenuItem"]:hover &&': {'--icon-color': 'var(--card-icon-color)'},
  '[data-ui="MenuItem"][data-hovered] &&': {'--icon-color': 'var(--card-icon-color)'},
  '[data-ui="MenuItem"][data-selected] &&': {'--icon-color': 'var(--card-icon-color)'},
  '[data-ui="MenuItem"][data-pressed] &&': {'--icon-color': 'var(--card-icon-color)'},
})
