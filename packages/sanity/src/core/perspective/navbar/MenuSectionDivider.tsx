import {clsx} from 'clsx'

import {
  menuSectionDivider,
  menuSectionDividerEnd,
  menuSectionDividerStart,
} from './MenuSectionDivider.css'

/**
 * The rule between two groups of a perspective menu, inset to the menu's 8px inset with 4px
 * above and below it. Render it inside a group padded `paddingX={2} paddingY={1}`, as the
 * group's first child (`placement="start"`) or its last (`placement="end"`).
 *
 * @internal
 */
export function MenuSectionDivider(props: {placement: 'start' | 'end'}) {
  return (
    <div
      aria-hidden
      className={clsx(
        menuSectionDivider,
        props.placement === 'start' ? menuSectionDividerStart : menuSectionDividerEnd,
      )}
      data-ui="MenuSectionDivider"
    />
  )
}
