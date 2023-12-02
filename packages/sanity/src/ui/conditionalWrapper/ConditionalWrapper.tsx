export type ConditionalWrapperRenderWrapperCallback = (children: React.ReactNode) => React.ReactNode

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
