import {useId as useReactId} from 'react'

export function useId(): string {
  const id = useReactId()
  // Uses the new format introduced in: https://github.com/facebook/react/pull/32001
  return id.startsWith(':') ? id.replace(/^:(.+):$/, '\u00AB$1\u00BB') : id
}
