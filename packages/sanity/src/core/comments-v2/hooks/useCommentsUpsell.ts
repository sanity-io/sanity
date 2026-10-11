import {useContext} from 'react'
import {CommentsUpsellContextV2} from 'sanity/_singletons'

import {type CommentsUpsellContextValue} from '../context/upsell/types'

export function useCommentsUpsell(): CommentsUpsellContextValue {
  const value = useContext(CommentsUpsellContextV2)

  if (!value) {
    // Instead of throwing, we return a dummy value to avoid breaking the CommentsField implementation, given the context is optional.
    return {
      upsellData: null,
      handleOpenDialog: () => null,
      handleClose: () => null,
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
