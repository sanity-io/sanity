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
 * The corners follow the pill. While something is selected the clear control sits beside the
 * trigger, so the trigger's right edge is square. Keyed off the card's `data-selected`, not
 * `:only-child`: a tooltip on a cut label wraps the trigger, which made it an only child.
 */
export const dropdownButtonTrigger = css({
  '&&': {
    borderRadius: pillRadius,
    zIndex: 1,
  },
  '[data-selected] > &&, [data-selected] > * > &&': {
    borderTopRightRadius: '0',
    borderBottomRightRadius: '0',
  },
})

export const dropdownButtonClear = css({
  '&&': {
    borderTopLeftRadius: '0',
    borderBottomLeftRadius: '0',
    borderTopRightRadius: pillRadius,
    borderBottomRightRadius: pillRadius,
    marginLeft: '-1px',
  },
  '&&:hover': {
    zIndex: 2,
  },
  // The navbar perspective chips draw their × at this scale; the header pills match them
  '& [data-sanity-icon]': {
    transform: 'scale(0.65)',
  },
})
