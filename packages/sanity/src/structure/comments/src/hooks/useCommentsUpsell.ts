import {useContext} from 'react'
import {CommentsUpsellContext} from '../context'
import {CommentsUpsellContextValue} from '../context/upsell/types'

/**
 * @beta
 * @hidden
 */
export function useCommentsUpsell(): CommentsUpsellContextValue {
  const value = useContext(CommentsUpsellContext)

  if (!value) {
    // Instead of throwing, we return a dummy value to avoid breaking the CommentsField implementation, given the context is optional.
    return {
      upsellData: null,
      setUpsellDialogOpen: () => null,
      upsellDialogOpen: false,
      telemetryLogs: {
        dialogSecondaryClicked: () => null,
        dialogPrimaryClicked: () => null,
        panelPrimaryClicked: () => null,
        panelSecondaryClicked: () => null,
      },
    }
  }

  return value
}
