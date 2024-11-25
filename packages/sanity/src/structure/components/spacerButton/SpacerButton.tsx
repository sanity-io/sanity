import {memo} from 'react'

import {Button, type ButtonProps} from '../../../ui-components'

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
export const SpacerButton = memo(function SpacerButton({size}: SpacerButtonProps) {
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
})
