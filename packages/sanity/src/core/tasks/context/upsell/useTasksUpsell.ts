import {useContext} from 'react'
import {TasksUpsellContext} from 'sanity/_singletons'

import {type TasksUpsellContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export function useTasksUpsell(): TasksUpsellContextValue {
  const value = useContext(TasksUpsellContext)

  if (!value) {
    // Instead of throwing, we return a dummy value to avoid breaking the tasks create action implementation, given the context is optional.
    return FALLBACK_CONTEXT_VALUE
  }
  return value
}

const FALLBACK_CONTEXT_VALUE = {
  upsellData: null,
  handleOpenDialog: () => null,
  upsellDialogOpen: false,
  telemetryLogs: {
    dialogSecondaryClicked: () => null,
    dialogPrimaryClicked: () => null,
    panelViewed: () => null,
    panelDismissed: () => null,
    panelPrimaryClicked: () => null,
    panelSecondaryClicked: () => null,
  },
} satisfies TasksUpsellContextValue
