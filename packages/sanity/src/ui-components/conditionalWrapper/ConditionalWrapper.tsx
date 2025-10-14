export type ConditionalWrapperRenderWrapperCallback = (children: React.ReactNode) => React.ReactNode

/**
 * A helper component that conditionally wraps its children in a wrapper component.
 *
 * @internal
 * @deprecated do not use this, just do the conditional inline
 */
export function ConditionalWrapper({
  children,
  condition,
  wrapper,
}: {
  children: React.ReactNode
  condition: boolean
  wrapper: ConditionalWrapperRenderWrapperCallback
}): React.ReactNode {
  if (!condition) {
    return children
  }

  return wrapper(children)
}
