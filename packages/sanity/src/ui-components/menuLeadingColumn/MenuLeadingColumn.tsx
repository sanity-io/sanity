import {clsx} from 'clsx'
import {type HTMLAttributes, type RefAttributes} from 'react'

import {menuLeadingColumn} from './MenuLeadingColumn.css'

/** @internal */
export type MenuLeadingColumnProps = HTMLAttributes<HTMLSpanElement> &
  RefAttributes<HTMLSpanElement>

/**
 * The 21px column that leads a row in the navbar's menus. Every row's glyph (a release dot, a
 * variant diamond, a calendar) is centred in it, so the glyphs of different menus share one
 * vertical line. Put it first in a row of your own layout; rows built with `MenuItem`'s `icon`
 * slot already have the same column.
 *
 * @internal
 */
export function MenuLeadingColumn(props: MenuLeadingColumnProps) {
  const {className, ref, ...rest} = props

  return <span {...rest} className={clsx(menuLeadingColumn, className)} ref={ref} />
}
