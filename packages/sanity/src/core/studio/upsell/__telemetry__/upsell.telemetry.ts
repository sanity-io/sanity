import {defineEvent} from '@sanity/telemetry'

interface UpsellDialogActionsInfo {
  feature: 'comments' | 'scheduled_publishing' | 'ai_assist' | 'tasks'
  type: 'modal' | 'inspector'
}

/** @internal */
export interface UpsellDialogViewedInfo extends UpsellDialogActionsInfo {
  source: 'field_action' | 'document_toolbar' | 'document_action' | 'navbar' | 'link' | 'pte'
}

/**
 * @internal
 */
export const UpsellDialogViewed = defineEvent<UpsellDialogViewedInfo>({
  name: 'Upsell Dialog Viewed',
  version: 1,
  description: 'User viewed the upsell dialog',
})

/**
 * @internal
 */
export const UpsellDialogDismissed = defineEvent<UpsellDialogActionsInfo>({
  name: 'Upsell Dialog Dismissed',
  version: 1,
  description: 'User dismissed the upsell dialog',
})

/**
 * @internal
 */
export const UpsellDialogUpgradeCtaClicked = defineEvent<UpsellDialogActionsInfo>({
  name: 'Upsell Dialog Upgrade CTA Clicked',
  version: 1,
  description: 'User clicked the "Upgrade" CTA in the upsell dialog',
})

/**
 * @internal
 */
export const UpsellDialogLearnMoreCtaClicked = defineEvent<UpsellDialogActionsInfo>({
  name: 'Upsell Dialog Learn More CTA Clicked',
  version: 1,
  description: 'User clicked the "Learn More" CTA in the upsell dialog',
})
