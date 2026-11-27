/* oxlint-disable no-restricted-imports */
import {Menu as UIMenu} from '@sanity/ui/menu'
import {type ComponentProps, type RefAttributes} from 'react'

/** @internal */
export type MenuProps = ComponentProps<typeof UIMenu> & RefAttributes<HTMLDivElement>

// The studio menu inset: `{space-2}` (8px) on every side, so the highlight of the first and last
// rows sits as far from the menu's edge as the sides do.
const MENU_PADDING_X = 2
// The `@sanity/ui` 5 popover pads 4px vertically (8px across, 4px down). When the studio moves to
// UI 5, this becomes a 4px vertical wrapper inside the popover that makes up the difference.
const MENU_PADDING_Y = 2

const PADDING_PROPS = [
  'padding',
  'paddingX',
  'paddingY',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
] as const

/**
 * Customized Sanity UI <Menu> that applies the studio menu inset, 8px on every side, instead of the
 * v4 default of 4px all round. A caller that passes any padding prop keeps full control of the
 * padding.
 *
 * @internal
 */
export function Menu(props: MenuProps) {
  const {ref, ...rest} = props
  const hasExplicitPadding = PADDING_PROPS.some((key) => rest[key] !== undefined)

  if (hasExplicitPadding) {
    return <UIMenu {...rest} ref={ref} />
  }

  return <UIMenu paddingX={MENU_PADDING_X} paddingY={MENU_PADDING_Y} {...rest} ref={ref} />
}
