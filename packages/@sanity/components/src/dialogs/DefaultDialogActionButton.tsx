import React, {useCallback} from 'react'
import Button from 'part:@sanity/components/buttons/default'
import {DialogAction} from './types'

export function DefaultDialogActionButton(props: {
  action: DialogAction
  index: number
  onAction?: (action: DialogAction) => void
}) {
  const {action, index, onAction} = props

  const handleAction = useCallback(() => {
    if (onAction) onAction(action)
  }, [action, onAction])

  return (
    <Button
      onClick={handleAction}
      data-action-index={index}
      color={action.color}
      disabled={action.disabled}
      kind={action.kind}
      inverted={action.inverted}
      autoFocus={action.autoFocus}
      icon={action.icon}
    >
      {action.title}
    </Button>
  )
}
