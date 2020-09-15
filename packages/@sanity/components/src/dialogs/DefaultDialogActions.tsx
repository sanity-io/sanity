import {partition} from 'lodash'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import React from 'react'
import {DefaultDialogActionButton} from './DefaultDialogActionButton'
import {DialogAction} from './types'

export function DefaultDialogActions(props: {
  actions: DialogAction[]
  actionsAlign?: 'start' | 'end'
  onAction?: (action: DialogAction) => void
}) {
  const {actions, actionsAlign = 'end', onAction} = props
  const [secondaryActions, primaryActions] = partition(actions, action => action.secondary)

  const primaryButtons = primaryActions.map((action, actionIndex) => {
    return (
      <DefaultDialogActionButton
        action={action}
        index={actionIndex}
        // eslint-disable-next-line react/no-array-index-key
        key={actionIndex}
        onAction={onAction}
      />
    )
  })

  const secondaryButtons = secondaryActions.map((action, actionIndex) => {
    return (
      <DefaultDialogActionButton
        action={action}
        index={actionIndex}
        // eslint-disable-next-line react/no-array-index-key
        key={actionIndex}
        onAction={onAction}
      />
    )
  })

  return (
    <ButtonGrid align={actionsAlign} secondary={secondaryButtons}>
      {primaryButtons}
    </ButtonGrid>
  )
}
