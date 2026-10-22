import {createContext, useContext} from 'react'
import {type ObservablePromise} from 'react-rx'
import {
  type UpsellDataResult,
  type UpsellDialogViewedInfo,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {type AiCredits} from '../util/aiCredits'

/** Where the dialog is opened from */
export type AiCreditsUpsellSource = Extract<
  UpsellDialogViewedInfo['source'],
  'agent_action' | 'ai_credits_card'
>

export interface AiCreditsUpsellContextValue {
  /**
   * The upsell content, settled once its request has answered; `NO_UPSELL_DATA` while the
   * organization's credits are not exhausted for want of a bigger plan. Read it with `use()` in
   * the leaf that renders it, under a `Suspense` boundary, never where a suspension would hold up
   * a control.
   */
  upsellDataPromise: ObservablePromise<UpsellDataResult>
  /** Opens the dialog, as the Upgrade button of the out-of-credits card does */
  openDialog: (source: AiCreditsUpsellSource) => void
  /**
   * An Agent Actions request was turned down for `limit`: opens the dialog when a bigger plan
   * would have let it through, and does nothing for a limit the organization set itself
   */
  requestTurnedDown: (limit: AiCredits) => void
}

/**
 * Only types are imported from `sanity` here, so the controls that consult the upsell do not
 * load the provider's dependencies with it; `AiCreditsUpsellProvider` is what mounts this.
 */
export const AiCreditsUpsellContext = createContext<AiCreditsUpsellContextValue | null>(null)

/** The AI credits upsell, or `null` outside the provider, where the out-of-credits card stands alone */
export function useAiCreditsUpsell(): AiCreditsUpsellContextValue | null {
  return useContext(AiCreditsUpsellContext)
}
