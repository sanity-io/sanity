/** @internal */
export interface StyleSheetDiagnostic {
  /** `sheet.cssRules.length` of a `<style data-styled>` element; 0 when the sheet is unavailable */
  ruleCount: number
  /** UTF-8 byte length of the inserted CSS (markup, or CSSOM when empty); optional for reports from older studios */
  sizeBytes?: number
  /** The element's `data-styled-version` attribute, the version of the runtime that owns it */
  version?: string
}

/** @internal */
export interface StylesDiagnostics {
  /**
   * One entry per `style[data-styled]` element in the document. More than one means several
   * styled-components runtimes are injecting styles (for example a plugin bundling its own copy).
   * Empty when nothing on the page uses styled-components.
   */
  styledComponents: StyleSheetDiagnostic[]
}

function getStyleSheetSizeBytes(node: HTMLStyleElement): number {
  // Dev / tests append text nodes, so innerHTML has the CSS. Production "speedy"
  // mode uses sheet.insertRule() and leaves the <style> markup empty.
  const cssText =
    node.innerHTML || Array.from(node.sheet?.cssRules ?? [], (rule) => rule.cssText).join('')
  return new TextEncoder().encode(cssText).byteLength
}

/** @internal */
export function getStylesDiagnostics(): StylesDiagnostics {
  if (typeof document === 'undefined') return {styledComponents: []}

  return {
    styledComponents: Array.from(
      document.querySelectorAll<HTMLStyleElement>('style[data-styled]'),
      (node) => ({
        ruleCount: node.sheet?.cssRules.length ?? 0,
        sizeBytes: getStyleSheetSizeBytes(node),
        version: node.dataset.styledVersion || undefined,
      }),
    ),
  }
}
