import React from 'react'
import Button, {ButtonProps} from 'part:@sanity/components/buttons/default'
import UndoIcon from 'part:@sanity/base/undo-icon'

export function RevertChangesButton(
  props: Omit<ButtonProps, 'icon' | 'kind' | 'padding' | 'size'>
): React.ReactElement {
  return (
    <Button {...props} icon={UndoIcon} kind="simple" padding="small" size="small">
      Revert changes
    </Button>
  )
}
