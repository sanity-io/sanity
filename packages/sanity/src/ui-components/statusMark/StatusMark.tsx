import {type BadgeTone} from '@sanity/ui'
import {clsx} from 'clsx'
import {type CSSProperties, type ReactNode, type RefAttributes, type SVGAttributes} from 'react'

import {statusMark} from './StatusMark.css'
import {
  STATUS_MARK_STROKE,
  STATUS_MARKS,
  type StatusMarkName,
  type StatusMarkSize,
  statusMarkGeometry,
} from './statusMarkGeometry'

/** Strokes stay 1.2px at any size, so lines never thin out on a small mark. */
const stroke = {
  stroke: 'currentColor',
  strokeWidth: STATUS_MARK_STROKE,
  strokeLinejoin: 'round',
  vectorEffect: 'non-scaling-stroke',
} as const

/** The drawings, in the 25-unit box of `@sanity/icons`, each centred on (12.5, 12.5). */
const DRAWINGS: Record<StatusMarkName, ReactNode> = {
  'published': <circle cx={12.5} cy={12.5} r={3.5} fill="currentColor" />,
  'undecided': <circle cx={12.5} cy={12.5} r={3.5} fill="currentColor" />,
  'draft': <circle cx={12.5} cy={12.5} r={2.9} fill="none" {...stroke} />,
  // The line drawings of BoltIcon, ClockIcon and SparkleIcon from @sanity/icons
  'asap': <path d="M18 11.5L9 21L11 13.5H7L16 4L14 11.5H18Z" {...stroke} />,
  'scheduled': (
    <path
      d="M12.5 8V12.5L15.5 15.5M20.5 12.5C20.5 16.9183 16.9183 20.5 12.5 20.5C8.08172 20.5 4.5 16.9183 4.5 12.5C4.5 8.08172 8.08172 4.5 12.5 4.5C16.9183 4.5 20.5 8.08172 20.5 12.5Z"
      {...stroke}
    />
  ),
  'agent': (
    <path
      d="M10.5 10.5C8.5 12.5 5 12.5 5 12.5C5 12.5 8.5 12.5 10.5 14.5C12.5 16.5 12.5 20 12.5 20C12.5 20 12.5 16.5 14.5 14.5C16.5 12.5 20 12.5 20 12.5C20 12.5 16.5 12.5 14.5 10.5C12.5 8.5 12.5 5 12.5 5C12.5 5 12.5 8.5 10.5 10.5Z"
      {...stroke}
    />
  ),
  // The variant diamond's drawings (RhombusIcon and RhombusOutlineIcon)
  'variant': (
    <path
      d="M12.8677 8.70769C12.6646 8.50462 12.3354 8.50462 12.1323 8.70769L8.70769 12.1323C8.50462 12.3354 8.50462 12.6646 8.70769 12.8677L12.1323 16.2923C12.3354 16.4954 12.6646 16.4954 12.8677 16.2923L16.2923 12.8677C16.4954 12.6646 16.4954 12.3354 16.2923 12.1323L12.8677 8.70769Z"
      fill="currentColor"
    />
  ),
  'variant-empty': (
    <path
      d="M12.6093 7.89167C12.6342 7.89773 12.6593 7.90569 12.6835 7.91609L12.7538 7.95417L12.7607 7.95906L12.7665 7.96394L12.8154 8.00398L12.8212 8.00788L12.8261 8.01374L16.9863 12.1739C17.0078 12.1955 17.0284 12.2189 17.0458 12.2452C17.08 12.2968 17.102 12.3542 17.1132 12.4122C17.1244 12.4702 17.1244 12.53 17.1132 12.588C17.102 12.6459 17.0797 12.7026 17.0458 12.754C17.0283 12.7805 17.0079 12.8046 16.9863 12.8262L12.8261 16.9864C12.6457 17.1666 12.3541 17.1667 12.1738 16.9864L8.0136 12.8262C7.83335 12.6459 7.83335 12.3543 8.0136 12.1739L12.1738 8.01374C12.2923 7.89524 12.4585 7.85506 12.6093 7.89167ZM8.99211 12.4991L12.4999 16.0069L16.0068 12.4991L12.4999 8.99226L8.99211 12.4991Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={0.3}
      vectorEffect="non-scaling-stroke"
    />
  ),
}

/** @internal */
export interface StatusMarkProps
  extends
    Omit<SVGAttributes<SVGSVGElement>, 'children' | 'width' | 'height' | 'viewBox'>,
    RefAttributes<SVGSVGElement> {
  mark: StatusMarkName
  /**
   * The mark size M: `row` (10px) leads a row or menu item, `list` (9px) sits in a document list
   * slot, `inline` (8px) sits in a chip, a pill or text. Each shape paints its share of M.
   *
   * @defaultValue 'row'
   */
  size?: StatusMarkSize
  /** Overrides the mark's own tone, as for an archived or paused release. */
  tone?: BadgeTone
}

/**
 * One status mark: a dot, a ring, a release pictogram, the agent sparkle or the variant diamond,
 * each at its optical size so they read as one size side by side. The svg's width and height are
 * its box in whole pixels and its viewBox is cropped to the drawing, so nothing is measured in the
 * browser. Decorative (`aria-hidden`) unless it is given an accessible name.
 *
 * @internal
 */
export function StatusMark(props: StatusMarkProps) {
  const {className, mark, ref, size = 'row', style, tone, ...rest} = props
  const {box, viewBox} = statusMarkGeometry(mark, size)
  const color = `var(--card-badge-${tone ?? STATUS_MARKS[mark].tone}-icon-color)`
  const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined

  return (
    <svg
      aria-hidden={named ? undefined : true}
      focusable={false}
      fill="none"
      {...rest}
      ref={ref}
      className={clsx(statusMark, className)}
      data-ui="StatusMark"
      data-mark={mark}
      data-size={size}
      width={box}
      height={box}
      viewBox={viewBox}
      style={{color, ...style} as CSSProperties}
    >
      {DRAWINGS[mark]}
    </svg>
  )
}
