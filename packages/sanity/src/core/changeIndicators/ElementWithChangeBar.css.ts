import {css} from '#styled-system/css'

// The marker and the button below take their state from the wrapper. Its own classes are atomic
// (one per declaration), so their rules key on the data attributes `ChangeBarWrapper` renders
// instead: `data-change-bar-wrapper` names the wrapper, and `data-changed`, `data-disabled`,
// `data-focused` and `data-review-changes-open` are present while that state holds. The marker
// reads the state attributes together with the wrapper attribute, so a `data-focused` on some
// other ancestor cannot match.
const wrapper = '[data-change-bar-wrapper]'

export const changeBarWrapper = css({
  '--change-bar-offset': '4px',
  'display': 'flex',
  'position': 'relative',
  '@media (hover: hover)': {
    '&:hover': {
      zIndex: 10,
    },
  },
})

export const changeBarMarker = css({
  'position': 'absolute',
  'top': '-1px',
  'left': 'var(--change-bar-offset)',
  'width': '1px',
  'bottom': '-1px',
  'backgroundColor': 'var(--card-bg-color)',
  '&::after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    top: '1px',
    left: 0,
    width: '1px',
    bottom: '1px',
    backgroundColor: 'var(--card-badge-caution-dot-color)',
    borderRadius: '0.5px',
  },
  [`${wrapper} &`]: {
    '&::after': {
      opacity: 0.5,
    },
  },
  [`${wrapper}[data-focused] &`]: {
    '&::after': {
      opacity: 1,
    },
  },
  /* hide when field is not changed */
  [`${wrapper}:not([data-changed]) &`]: {
    '&::after': {
      opacity: 0,
      pointerEvents: 'none',
    },
  },
  [`${wrapper}[data-disabled] &`]: {
    '&::after': {
      display: 'none',
    },
  },
  '@media (hover: hover)': {
    [`${wrapper}:hover &`]: {
      '&::after': {
        opacity: 1,
      },
    },
  },
})

export const changeBarButton = css({
  'appearance': 'none',
  'border': 0,
  'outline': 0,
  'display': 'block',
  'padding': 0,
  'background': 'transparent',
  'opacity': 0,
  'position': 'absolute',
  'height': '100%',
  'left': 'calc(-0.25rem + var(--change-bar-offset))',
  'width': 'calc(1rem - 1px)',
  'transition': 'opacity 250ms',
  '&:focus': {
    border: 0,
    outline: 0,
  },
  /* hide the change bar button when review changes is open */
  // Read on its own (the attribute name is this wrapper's) rather than together with the wrapper
  // attribute: at that same specificity, the hover effect below, emitted later, keeps winning
  // over this rule on hover, as it always has.
  '[data-review-changes-open] &': {
    opacity: 0,
  },
})

export const changeBarButtonInteractive = css({
  cursor: 'pointer',
  pointerEvents: 'all',
})

export const changeBarButtonWithHoverEffect = css({
  '@media (hover: hover)': {
    '&:hover': {
      opacity: 0.2,
    },
  },
})

export const fieldWrapper = css({
  flexGrow: 1,
  minWidth: 0,
})

export const changeBar = css({
  position: 'relative',
  opacity: 1,
  transition: 'opacity 100ms',
})
