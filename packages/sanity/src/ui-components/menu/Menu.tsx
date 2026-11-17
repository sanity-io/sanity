import {Menu as UIMenu} from '@sanity/ui/menu'
import {type ComponentProps, type RefAttributes} from 'react'

/** @internal */
export type MenuProps = ComponentProps<typeof UIMenu> & RefAttributes<HTMLDivElement>

// The `@sanity/ui` 5 popover inset: `{space-2}` (8px) across and `{space-1}` (4px) down.
const MENU_PADDING_X = 2
const MENU_PADDING_Y = 1

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
 * Customized Sanity UI <Menu> that applies the `@sanity/ui` 5 menu inset, 8px across and 4px
 * down, instead of the v4 default of 4px all round. A caller that passes any padding prop keeps
 * full control of the padding.
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
