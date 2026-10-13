/**
 * `'default'` when the plan has scheduled publishing, `'upsell'` when it does not, `null` when
 * the feature check failed.
 * @internal
 */
export type ScheduledPublishingMode = 'default' | 'upsell' | null
