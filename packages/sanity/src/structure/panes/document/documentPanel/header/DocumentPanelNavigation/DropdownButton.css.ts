import {css} from '#styled-system/css'

/** Large enough that the controls become a pill whatever their height. */
const pillRadius = '9999px'

/**
 * Lines the trigger and the clear control up in the pill and clips their hover fill to it. The
 * chip stays as wide as its controls, including when it is not a flex item.
 */
export const dropdownButtonCard = css({
  'overflow': 'hidden',
  'width': 'fit-content',
  '&&': {
    alignItems: 'center',
  },
})

/** Hairline between the trigger and the clear control. */
export const dropdownButtonDivider = css({
  width: '1px',
  alignSelf: 'stretch',
  backgroundColor: 'var(--card-border-color)',
})

/**
 * The left corners follow the pill. The right corners do too when the trigger is the only
 * control; a clear control beside it keeps that edge square.
 */
export const dropdownButtonTrigger = css({
  '&&': {
    borderTopLeftRadius: pillRadius,
    borderBottomLeftRadius: pillRadius,
    borderTopRightRadius: '0',
    borderBottomRightRadius: '0',
  },
  '&&:only-child': {
    borderTopRightRadius: pillRadius,
    borderBottomRightRadius: pillRadius,
  },
})

export const dropdownButtonClear = css({
  '&&': {
    borderTopLeftRadius: '0',
    borderBottomLeftRadius: '0',
    borderTopRightRadius: pillRadius,
    borderBottomRightRadius: pillRadius,
  },
})
