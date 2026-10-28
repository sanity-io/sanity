import {css} from '#styled-system/css'

/** `@sanity/ui` `radius="full"`. Large enough that the 31px controls become a pill. */
const pillRadius = '9999px'

/**
 * Centers the trigger and the clear control in the pill, and clips their
 * hover fill to it. The clip also cuts off a square focus ring at the
 * corners, so each control rounds the corners that meet the pill.
 */
export const perspectiveButtonCard = css({
  'overflow': 'hidden',
  // A block-level card stretches to its parent. The chip should stay as wide
  // as the trigger, including when it is not a flex item.
  'width': 'fit-content',
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
    borderTopRightRadius: pillRadius,
    borderBottomRightRadius: pillRadius,
    borderTopLeftRadius: '0',
    borderBottomLeftRadius: '0',
  },
  '& [data-sanity-icon]': {
    transform: 'scale(0.65)',
  },
})

/**
 * Trigger. The button root ships `padding: 0` and `radius={0}`; `&&` wins
 * over both. The left corners follow the pill. The right corners do too when
 * this is the only control — a clear button beside it keeps that edge square.
 */
export const perspectiveButtonTrigger = css({
  '&&': {
    height: '31px',
    paddingLeft: '6px',
    paddingRight: '4px',
    borderTopLeftRadius: pillRadius,
    borderBottomLeftRadius: pillRadius,
  },
  '&:only-child': {
    borderTopRightRadius: pillRadius,
    borderBottomRightRadius: pillRadius,
  },
})
