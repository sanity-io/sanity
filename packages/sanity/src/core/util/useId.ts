import {useId as useReactId} from 'react'

/**
 * React's `useId`, rewritten when needed so the result is a CSS custom-ident.
 *
 * `view-transition-name` rejects the legacy `:r1:` form. React 19.2+ already
 * returns a CSS-safe id (https://github.com/facebook/react/pull/32001); older
 * ids are converted to that shape.
 *
 * @internal
 */
export function useId(): string {
  const id = useReactId()
  return id.startsWith(':') ? id.replace(/^:(.+):$/, '\u00AB$1\u00BB') : id
}
