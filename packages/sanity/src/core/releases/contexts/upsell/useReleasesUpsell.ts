import {useContext} from 'react'
import {ReleasesUpsellContext} from 'sanity/_singletons'

import {SETTLED_WITHOUT_UPSELL_DATA} from '../../../hooks/useUpsellData'
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
  mode: 'default' as const,
  onReleaseLimitReached: () => null,
  guardWithReleaseLimitUpsell: async () => undefined,
  handleOpenDialog: () => null,
  upsellDataPromise: SETTLED_WITHOUT_UPSELL_DATA,
  telemetryLogs: {
    dialogSecondaryClicked: () => null,
    dialogPrimaryClicked: () => null,
    panelViewed: () => null,
    panelDismissed: () => null,
    panelPrimaryClicked: () => null,
    panelSecondaryClicked: () => null,
  },
} satisfies ReleasesUpsellContextValue
