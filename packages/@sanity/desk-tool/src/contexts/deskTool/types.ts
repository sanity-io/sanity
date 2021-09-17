/**
 * @internal
 */
export interface DeskToolFeatures {
  /**
   * @beta
   */
  backButton: boolean
  reviewChanges: boolean
  splitPanes: boolean
  splitViews: boolean
}

/**
 * @internal
 */
export interface DeskToolContextValue {
  features: DeskToolFeatures
  layoutCollapsed: boolean
}
