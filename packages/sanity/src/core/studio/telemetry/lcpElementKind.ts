import {type LcpElementKind} from '../__telemetry__/performance.telemetry'

// The structure tool owns these test ids; core can only match them in the DOM.
const TITLE_SELECTOR = '[data-testid^="document-panel-document-title"]'
const FORM_SELECTOR = '[data-testid="form-view"]'

/** @internal */
export interface PaintedElement {
  element: Element | null
  url: string
}

/**
 * Buckets a soft LCP element so image-led document opens can be split from title-led ones.
 *
 * @internal
 */
export function toLcpElementKind({element, url}: PaintedElement): LcpElementKind {
  if (url) return 'image'
  if (element?.closest(TITLE_SELECTOR)) return 'title'
  if (element?.closest(FORM_SELECTOR)) return 'field'
  return 'other'
}
