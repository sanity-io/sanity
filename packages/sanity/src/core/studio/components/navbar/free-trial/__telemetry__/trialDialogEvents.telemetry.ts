import {defineEvent} from '@sanity/telemetry'

type TrialStage = 'trialStarted' | 'trialActive' | 'trialEndingSoon' | 'trialEnded' | 'postTrial'

type BaseDialogEventAttributes = {
  source: 'studio'
  trialDaysLeft: number
  dialogType: 'modal' | 'popover'
  dialogId: string
  dialogRevision: string
  dialogTrialStage: TrialStage
}

export interface TrialDialogViewedInfo extends BaseDialogEventAttributes {
  dialogTrigger: 'fromClick' | 'auto'
}

export const TrialDialogViewed = defineEvent<TrialDialogViewedInfo>({
  name: 'Trial Dialog Viewed',
  version: 1,
  description: 'User viewed a dialog or popover related to free trial',
})

export interface TrialDialogDismissedInfo extends BaseDialogEventAttributes {
  dialogDismissAction: 'ctaClicked' | 'xClick' | 'outsideClick'
}

export const TrialDialogDismissed = defineEvent<TrialDialogDismissedInfo>({
  name: 'Trial Dialog Dismissed',
  version: 1,
  description: 'User dismissed a dialog or popover related to free trial',
})

export interface TrialDialogCTAClickedInfo extends BaseDialogEventAttributes {
  dialogCtaType: 'upgrade' | 'learnMore'
}

export const TrialDialogCTAClicked = defineEvent<TrialDialogCTAClickedInfo>({
  name: 'Trial Dialog CTA Clicked',
  version: 1,
  description: 'User clicked a CTA in a dialog or popover related to free trial',
})

export function getTrialStage({
  showOnLoad,
  dialogId,
}: {
  showOnLoad: boolean
  dialogId: string
}): TrialStage {
  // Note: some of the ids in the trial experience studio have uppercase letters
  // so the toLowerCase is important here
  if (showOnLoad && dialogId.toLowerCase() === 'free-upgrade-popover') return 'trialStarted'
  if (showOnLoad && dialogId.toLowerCase() === 'trial-ending-popover') return 'trialEndingSoon'
  if (showOnLoad && dialogId.toLowerCase() === 'project-downgraded-to-free') return 'trialEnded'
  if (!showOnLoad && dialogId.toLowerCase() === 'after-trial-upgrade') return 'postTrial'
  return 'trialActive'
}
