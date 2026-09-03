import {version as styledComponentsVersion} from 'styled-components'

/** @internal */
export interface StyleSheetDiagnostic {
  /** `sheet.cssRules.length` of a `<style data-styled>` element; 0 when the sheet is unavailable */
  ruleCount: number
  /** The element's `data-styled-version` attribute, when present */
  version?: string
}

/** @internal */
export interface StylesDiagnostics {
  styledComponents: {
    /**
     * One entry per `style[data-styled]` element in the document. More than one means several
     * styled-components runtimes are injecting styles. Empty once the Studio no longer uses
     * styled-components.
     */
    styleNodes: StyleSheetDiagnostic[]
    /** The styled-components version bundled with this `sanity` package, when it exposes one */
    version?: string
  }
}

/** @internal */
export function getStylesDiagnostics(): StylesDiagnostics {
  const styleNodes: StyleSheetDiagnostic[] =
    typeof document === 'undefined'
      ? []
      : Array.from(document.querySelectorAll<HTMLStyleElement>('style[data-styled]'), (node) => ({
          ruleCount: countRules(node.sheet),
          version: node.dataset.styledVersion || undefined,
        }))

  return {styledComponents: {styleNodes, version: getBundledVersion()}}
}

// Typed as string, but a bundle whose styled-components lacks the export yields undefined.
function getBundledVersion(): string | undefined {
  const version: unknown = styledComponentsVersion
  return typeof version === 'string' ? version : undefined
}

function countRules(sheet: CSSStyleSheet | null): number {
  try {
    return sheet?.cssRules.length ?? 0
  } catch {
    return 0
  }
}
