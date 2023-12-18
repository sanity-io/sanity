import React from 'react'
import {Button, ButtonProps} from 'sanity/ui-components'

interface SpacerButtonProps {
  size?: ButtonProps['size']
}

/**
 * This renders a visually hidden <Button> component that is still contributes
 * to document layout.
 *
 * It's used to simplify padding in Sanity UI components that contain buttons which
 * may not always be rendered.
 *
 * TODO: let's find a more elegant solve to this layout shift problem
 *
 * @internal
 */
export function SpacerButton({size}: SpacerButtonProps) {
  return (
    <Button
      aria-hidden
      disabled
      size={size}
      style={{
        pointerEvents: 'none',
        visibility: 'hidden',
        width: 0,
      }}
      text="-"
    />
  )
}
