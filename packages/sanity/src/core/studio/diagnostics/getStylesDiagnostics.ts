/** @internal */
export interface StyleSheetDiagnostic {
  /** `sheet.cssRules.length` of a `<style data-styled>` element; 0 when the sheet is unavailable */
  ruleCount: number
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

/** @internal */
export function getStylesDiagnostics(): StylesDiagnostics {
  if (typeof document === 'undefined') return {styledComponents: []}

  return {
    styledComponents: Array.from(
      document.querySelectorAll<HTMLStyleElement>('style[data-styled]'),
      (node) => ({
        ruleCount: countRules(node.sheet),
        version: node.dataset.styledVersion || undefined,
      }),
    ),
  }
}

function countRules(sheet: CSSStyleSheet | null): number {
  try {
    return sheet?.cssRules.length ?? 0
  } catch {
    return 0
  }
}
