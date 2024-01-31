import {defineEvent} from '@sanity/telemetry'
import {FreeTrialDialog} from '../types'

type BaseDialogEventAttributes = {
  source: 'studio'
  trialDaysLeft: number
  dialogType: FreeTrialDialog['dialogType']
  dialogId: FreeTrialDialog['id']
  dialogRevision: FreeTrialDialog['_rev']
  dialogTrialStage:
    | 'trial_started'
    | 'trial_active'
    | 'trial_ending_soon'
    | 'trial_ended'
    | 'post_trial'
}

export interface TrialDialogViewedInfo extends BaseDialogEventAttributes {
  dialogTrigger: 'from_click' | 'auto'
}

export const TrialDialogViewed = defineEvent<TrialDialogViewedInfo>({
  name: 'TrialDialogViewed',
  version: 1,
  description: 'User viewed a dialog or popover related to free trial',
})

export interface TrialDialogDismissedInfo extends BaseDialogEventAttributes {
  dialogDismissAction: 'cta_clicked' | 'x_click' | 'outside_click'
}

export const TrialDialogDismissed = defineEvent<TrialDialogDismissedInfo>({
  name: 'TrialDialogDismissed',
  version: 1,
  description: 'User dismissed a dialog or popover related to free trial',
})

export interface TrialDialogCTAClickedInfo extends BaseDialogEventAttributes {
  dialogCtaType: 'upgrade' | 'learn_more'
}

export const TrialDialogCTAClicked = defineEvent<TrialDialogCTAClickedInfo>({
  name: 'TrialDialogCTAClicked',
  version: 1,
  description: 'User clicked a CTA in a dialog or popover related to free trial',
})

export function getTrialStage({
  showOnLoad,
  dialogId,
}: {
  showOnLoad: boolean
  dialogId: string
}): 'trial_started' | 'trial_ending_soon' | 'trial_ended' | 'post_trial' | 'trial_active' {
  if (showOnLoad && dialogId === 'Free-upgrade-popover') return 'trial_started'
  if (showOnLoad && dialogId === 'trial-ending-popover') return 'trial_ending_soon'
  if (showOnLoad && dialogId === 'project-downgraded-to-free') return 'trial_ended'
  if (!showOnLoad && dialogId === 'after-trial-upgrade') return 'post_trial'
  return 'trial_active'
}
