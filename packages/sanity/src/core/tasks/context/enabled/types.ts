/**
 * `'default'` when the plan has the tasks feature, `'upsell'` when it does not, `null` when the
 * feature check failed or the workspace opted out.
 * @internal
 */
export type TasksMode = 'default' | 'upsell' | null
