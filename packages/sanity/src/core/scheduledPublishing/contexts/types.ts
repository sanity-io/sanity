/**
 * `'default'` when the plan has the scheduled publishing feature, `'upsell'` when it does not,
 * `null` when the feature is not enabled for the workspace (the check failed, or the dataset has
 * never scheduled anything and the workspace did not opt in explicitly).
 * @internal
 */
export type ScheduledPublishingMode = 'default' | 'upsell' | null
