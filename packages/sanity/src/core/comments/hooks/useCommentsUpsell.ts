import {useContext} from 'react'
import {CommentsUpsellContext} from 'sanity/_singletons'

import {type CommentsUpsellContextValue} from '../context/upsell/types'

export function useCommentsUpsell(): CommentsUpsellContextValue {
  const value = useContext(CommentsUpsellContext)

  if (!value) {
    // Instead of throwing, we return a dummy value to avoid breaking the CommentsField implementation, given the context is optional.
    return {
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
    }
  }

  return value
}
