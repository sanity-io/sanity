/**
 * Identifies which pane the narrow-viewport tab bar is currently showing. Maps
 * directly onto the panels assembled in `PresentationTool`: the preview iframe,
 * the optional navigator, and the document (structure) editor.
 *
 * @internal
 */
export type PresentationLayoutTab = 'preview' | 'navigator' | 'content'

/**
 * The DOM id applied to a panel's root element so its narrow-mode tab can
 * reference it via `aria-controls`.
 *
 * @internal
 */
export function getPresentationPanelHtmlId(tab: PresentationLayoutTab): string {
  return `presentation-narrow-panel-${tab}`
}
