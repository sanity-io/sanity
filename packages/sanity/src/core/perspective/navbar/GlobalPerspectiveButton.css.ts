import {css} from '#styled-system/css'

/** Centers the trigger and the clear control in the pill. */
export const perspectiveButtonCard = css({
  'overflow': 'hidden',
  '&&': {
    alignItems: 'center',
  },
})

/** Hairline between the trigger and the clear control. */
export const perspectiveButtonDivider = css({
  width: '1px',
  height: '31px',
  alignSelf: 'stretch',
  backgroundColor: 'var(--card-border-color)',
})

/**
 * Clear control. The button root ships `padding: 0`, and the padding prop is
 * applied to the inner span — `&&` wins on both, so this padding is the one
 * that shows.
 */
export const perspectiveButtonClear = css({
  '&&': {
    height: '31px',
    padding: '0 2px',
  },
  '& [data-sanity-icon]': {
    transform: 'scale(0.65)',
  },
})

/** Trigger. The button root ships `padding: 0`; `&&` wins over that rule. */
export const perspectiveButtonTrigger = css({
  '&&': {
    height: '31px',
    paddingLeft: '6px',
    paddingRight: '4px',
  },
})
