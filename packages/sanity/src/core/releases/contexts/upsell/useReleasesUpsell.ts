import {useContext} from 'react'

import {ReleasesUpsellContext} from '../../../../_singletons/context/ReleasesUpsellContext'
import {type ReleasesUpsellContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export function useReleasesUpsell(): ReleasesUpsellContextValue {
  const value = useContext(ReleasesUpsellContext)

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
  execIfNotUpsell: () => null,
  telemetryLogs: {
    dialogSecondaryClicked: () => null,
    dialogPrimaryClicked: () => null,
    panelViewed: () => null,
    panelDismissed: () => null,
    panelPrimaryClicked: () => null,
    panelSecondaryClicked: () => null,
  },
} satisfies ReleasesUpsellContextValue
