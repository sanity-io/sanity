import {clsx} from 'clsx'
import {type HTMLAttributes, type RefAttributes} from 'react'

import {RhombusIcon, RhombusOutlineIcon} from '../../core/components/temporary-icons/Rhombus'
import {inlineSize, rowSize, variantMark} from './VariantMark.css'

/**
 * Tight viewBoxes: the glyph's tips touch the edges of the box, so the box width is the
 * drawn width, tip to tip.
 */
const FILLED_VIEW_BOX = '8.555 8.555 7.889 7.889'
const OUTLINE_VIEW_BOX = '7.73 7.73 9.54 9.54'

/** @internal */
export interface VariantMarkProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>, RefAttributes<HTMLSpanElement> {
  /**
   * `inline` (8px, tip to tip) sits beside text in chips, pills and badges.
   * `row` (9.2px) leads a menu or list row.
   *
   * @defaultValue 'inline'
   */
  size?: 'inline' | 'row'
  /**
   * `filled` is a variant; `outline` is a variant the document has no version in.
   *
   * @defaultValue 'filled'
   */
  fill?: 'filled' | 'outline'
}

/**
 * The variant diamond. Decorative (`aria-hidden`) unless it is given an accessible name.
 *
 * @internal
 */
export function VariantMark(props: VariantMarkProps) {
  const {className, fill = 'filled', ref, size = 'inline', ...rest} = props
  const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined
  // The glyph opts out of the `[data-sanity-icon]` rules of buttons and menu items, which would
  // repaint it; the mark owns its colour.
  const glyph = {'data-sanity-icon': undefined, 'focusable': false} as const

  return (
    <span
      aria-hidden={named ? undefined : true}
      {...rest}
      className={clsx(variantMark, size === 'row' ? rowSize : inlineSize, className)}
      data-fill={fill}
      data-size={size}
      data-ui="VariantMark"
      ref={ref}
    >
      {fill === 'outline' ? (
        <RhombusOutlineIcon {...glyph} viewBox={OUTLINE_VIEW_BOX} />
      ) : (
        <RhombusIcon {...glyph} viewBox={FILLED_VIEW_BOX} />
      )}
    </span>
  )
}
