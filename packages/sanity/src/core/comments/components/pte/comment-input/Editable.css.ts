import {css, firstThatWorks} from '#styled-system/css'

/** `color.input.default.enabled.placeholder` */
export const placeholderColorVar = '--editable-placeholder-color'
/** `space[1]` */
export const space1Var = '--editable-space-1'
/** `radius[3]` */
export const radius3Var = '--editable-radius-3'

export const placeholderWrapper = css({
  color: `var(${placeholderColorVar})`,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  textWrap: 'nowrap',
  display: 'block',
})

export const styledPopover = css({
  "&[data-placement='bottom']": {
    transform: `translateY(var(${space1Var}))`,
  },
  "&[data-placement='top']": {
    transform: `translateY(calc(-1 * var(${space1Var})))`,
  },
  // The wrapper is a Flex rendered by Popover; (0,2,0) matches the original descendant rule
  "& [data-ui='Popover__wrapper']": {
    borderRadius: `var(${radius3Var})`,
    display: 'flex',
    flexDirection: 'column',
    overflow: firstThatWorks('hidden', 'clip'),
    position: 'relative',
    width: '300px',
    // todo: improve
  },
})
