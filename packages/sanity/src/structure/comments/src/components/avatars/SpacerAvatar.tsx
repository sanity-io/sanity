import React from 'react'

export const AVATAR_HEIGHT = 25

const INLINE_STYLE: React.CSSProperties = {
  minWidth: AVATAR_HEIGHT,
}

/**
 * This component is used to as a spacer in situations where we want to align
 * components without avatars with components that have avatars.
 */
export function SpacerAvatar() {
  return <div style={INLINE_STYLE} />
}
