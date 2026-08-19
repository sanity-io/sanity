/**
 * Features supported by the host rendering panes (e.g. the structure tool).
 *
 * Hosts provide this via `PaneFeaturesProvider`; when no provider is present
 * (e.g. a document pane embedded in another tool), sensible defaults apply.
 *
 * @internal
 */
export interface PaneFeatures {
  /**
   * @hidden
   * @beta
   */
  backButton: boolean
  resizablePanes: boolean
  reviewChanges: boolean
  splitPanes: boolean
  splitViews: boolean
}
