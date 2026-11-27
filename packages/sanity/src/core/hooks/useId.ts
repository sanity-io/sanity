import {useId as useReactId} from 'react'

/**
 * React's older `useId` form (`:r1:`) is not a valid CSS custom-ident, so it
 * cannot be a `view-transition-name`. The format from
 * https://github.com/facebook/react/pull/32001 is already safe.
 *
 * @internal
 */
export function toCssSafeId(id: string): string {
  return id.startsWith(':') ? id.replace(/^:(.+):$/, '\u00AB$1\u00BB') : id
}

/** @internal */
export function useId(): string {
  return toCssSafeId(useReactId())
}
