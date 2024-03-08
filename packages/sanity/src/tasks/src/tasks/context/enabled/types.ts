/**
 * @internal
 */
export type TasksEnabledContextValue =
  | {
      enabled: false
      mode: null
    }
  | {
      enabled: true
      mode: 'default' | null // Prepare to support upsell or different modes in a future
    }
