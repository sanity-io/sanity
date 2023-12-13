import React from 'react'
import {Button, ButtonProps} from '..'

interface SpacerButtonProps {
  size?: ButtonProps['size']
}

/**
 * A temporary component used to simplify spacing in components with
 * conditional buttons.
 * TODO: find a more elegant solve to this layout shift problem
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
