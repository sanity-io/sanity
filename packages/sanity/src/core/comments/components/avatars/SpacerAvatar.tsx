import React from 'react'

const INLINE_STYLE: React.CSSProperties = {
  minWidth: 25,
}

/**
 * This component is used to as a spacer in situations where we want to align
 * components without avatars with components that have avatars.
 */
export function SpacerAvatar() {
  return <div style={INLINE_STYLE} />
}
