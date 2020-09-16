import React from 'react'
import Button from 'part:@sanity/components/buttons/default'
import UndoIcon from 'part:@sanity/base/undo-icon'

export function RevertChangesButton({onClick}: {onClick?: () => void}): React.ReactElement {
  return (
    <Button onClick={onClick} kind="simple" padding="small" size="small" icon={UndoIcon}>
      Revert changes
    </Button>
  )
}
