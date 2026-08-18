/**
 * Which pane the narrow-viewport tab bar shows: preview, navigator, or document editor.
 *
 * @internal
 */
export type PresentationLayoutTab = 'preview' | 'navigator' | 'content'

/**
 * DOM id of a panel's root, used as the `aria-controls` target for its tab.
 *
 * @internal
 */
export function getPresentationPanelHtmlId(tab: PresentationLayoutTab): string {
  return `presentation-narrow-panel-${tab}`
}
