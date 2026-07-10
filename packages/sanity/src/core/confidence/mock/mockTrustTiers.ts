import {type ConfidenceHat, type TrustTier} from './types'

export type TrustOperation = 'copyEdit' | 'translate' | 'publish' | 'restructure'

/**
 * frozen mock — earning/revoking tiers is internal work (addendum §7)
 */
export const TRUST_TIER_TABLE: Record<
  ConfidenceHat,
  Record<TrustOperation, TrustTier>
> = Object.freeze({
  'strategist': {copyEdit: 'T2', translate: 'T0', publish: 'T1', restructure: 'T0'},
  'author': {copyEdit: 'T3', translate: 'T1', publish: 'T2', restructure: 'T0'},
  'reviewer': {copyEdit: 'T3', translate: 'T1', publish: 'T3', restructure: 'T0'},
  'localizer': {copyEdit: 'T2', translate: 'T3', publish: 'T2', restructure: 'T0'},
  'developer': {copyEdit: 'T1', translate: 'T0', publish: 'T1', restructure: 'T0'},
  'marketer': {copyEdit: 'T2', translate: 'T1', publish: 'T1', restructure: 'T0'},
  'ops-owner': {copyEdit: 'T2', translate: 'T1', publish: 'T3', restructure: 'T0'},
})

export function getMockTier(hat: ConfidenceHat, operation: TrustOperation): TrustTier {
  return TRUST_TIER_TABLE[hat][operation]
}
