import {type ReactNode} from 'react'

/**
 * Inline monospace snippet for use with {@link Translate}'s `components` map.
 *
 * @public
 */
export function InlineCode({children}: {children?: ReactNode}) {
  return (
    <code
      style={{
        color: 'var(--foreground-low)',
        background: 'var(--background-low)',
        borderRadius: 1,
      }}
    >
      {children}
    </code>
  )
}
