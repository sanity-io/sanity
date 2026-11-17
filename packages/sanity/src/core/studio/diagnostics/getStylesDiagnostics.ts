/** @internal */
export interface StyleSheetDiagnostic {
  /** `sheet.cssRules.length` of a `<style data-styled>` element; 0 when the sheet is unavailable */
  ruleCount: number
  /** UTF-8 byte length of the generated CSS, as it would be in an external stylesheet */
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

const textEncoder = new TextEncoder()

/** @internal */
export function getStylesDiagnostics(): StylesDiagnostics {
  if (typeof document === 'undefined') return {styledComponents: []}

  return {
    styledComponents: Array.from(
      document.querySelectorAll<HTMLStyleElement>('style[data-styled]'),
      (node) => {
        const {css, ruleCount} = readStyleSheet(node)
        return {
          ruleCount,
          sizeBytes: textEncoder.encode(css).byteLength,
          version: node.dataset.styledVersion || undefined,
        }
      },
    ),
  }
}

function readStyleSheet(node: HTMLStyleElement): {css: string; ruleCount: number} {
  try {
    const rules = node.sheet?.cssRules
    if (rules) {
      return {
        css: Array.from(rules, (rule) => rule.cssText).join(''),
        ruleCount: rules.length,
      }
    }
  } catch {
    // Cross-origin or otherwise inaccessible CSSOM sheets throw on `cssRules`.
  }

  return {css: node.textContent ?? '', ruleCount: 0}
}
