import {type ReactNode, useLayoutEffect, useRef} from 'react'

import {fitGlyph} from '../../utils/fitGlyph'

/**
 * How big every glyph in the shared leading column paints, in px: the group icons (the Published
 * and Draft dots, a release bolt or clock) and the rows' variant diamond alike.
 *
 * @internal
 */
export const LEADING_GLYPH_SIZE = 10

/**
 * A cell of the shared leading column. Its icon is scaled so the glyph paints
 * {@link LEADING_GLYPH_SIZE} px, so a dot, a clock and a diamond read as one size down the panel.
 *
 * @internal
 */
export function LeadingGlyph({
  className,
  children,
  'data-testid': testId,
}: {
  'className': string
  'children'?: ReactNode
  'data-testid'?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)

  // Runs after every render, before paint: the icon can change with the set's release.
  useLayoutEffect(() => {
    const svg = ref.current?.querySelector('svg')
    if (svg) fitGlyph(svg, LEADING_GLYPH_SIZE)
  })

  return (
    <span ref={ref} className={className} data-testid={testId}>
      {children}
    </span>
  )
}
