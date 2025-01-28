import {useContext} from 'react'

import {ReleasesUpsellContext} from '../../../../_singletons/context/ReleasesUpsellContext'
import {type ReleasesUpsellContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export function useReleasesUpsell(): ReleasesUpsellContextValue {
  const value = useContext(ReleasesUpsellContext)

  if (!value) return FALLBACK_CONTEXT_VALUE

  return value
}

const FALLBACK_CONTEXT_VALUE = {
  upsellDialogOpen: false,
  setUpsellLimit: () => null,
  guardWithReleaseLimitUpsell: () => Promise.resolve(false),
  telemetryLogs: {
    dialogSecondaryClicked: () => null,
    dialogPrimaryClicked: () => null,
    panelViewed: () => null,
    panelDismissed: () => null,
    panelPrimaryClicked: () => null,
    panelSecondaryClicked: () => null,
  },
} satisfies ReleasesUpsellContextValue
