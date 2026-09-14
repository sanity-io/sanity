import {TextSkeleton} from '@sanity/ui'

const INLINE_STYLE = {display: 'inline-block', verticalAlign: 'middle', width: '6em'} as const

/**
 * Placeholder for an inline object or annotation inside Portable Text while a lazy component
 * loads. Renders as a `span` so the surrounding text keeps its line layout.
 *
 * @internal
 */
export function FormInlineSkeleton() {
  return (
    <TextSkeleton
      animated
      data-testid="form-inline-skeleton"
      forwardedAs="span"
      radius={1}
      style={INLINE_STYLE}
    />
  )
}
