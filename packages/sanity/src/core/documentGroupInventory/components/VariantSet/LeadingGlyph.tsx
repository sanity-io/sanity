import {type ReactNode, useLayoutEffect, useRef} from 'react'

import {fitGlyph, glyphKey} from '../../utils/fitGlyph'

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
  const fitted = useRef<{svg: SVGSVGElement; key: string | undefined} | null>(null)

  // Runs after every render, before paint, since the icon can change with the set's release. A
  // render that keeps the same svg node and glyph does nothing beyond reading two attributes: no
  // layout read, no style write. A new node or glyph gets the cached scale written, and only the
  // first of each glyph is measured (see fitGlyph).
  useLayoutEffect(() => {
    const svg = ref.current?.querySelector('svg')
    if (!svg) return
    const key = glyphKey(svg, LEADING_GLYPH_SIZE)
    if (fitted.current?.svg === svg && fitted.current.key === key && key !== undefined) return
    // A hidden glyph is not recorded, so the next render tries again
    fitted.current = fitGlyph(svg, LEADING_GLYPH_SIZE) ? {svg, key} : null
  })

  return (
    <span ref={ref} className={className} data-testid={testId}>
      {children}
    </span>
  )
}
