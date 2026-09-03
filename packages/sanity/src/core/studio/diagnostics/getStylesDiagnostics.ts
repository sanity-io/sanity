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
     * styled-components runtimes are injecting styles.
     */
    styleNodes: StyleSheetDiagnostic[]
    /** The styled-components version bundled with this `sanity` package */
    version: string
  }
}

/** @internal */
export function getStylesDiagnostics(): StylesDiagnostics {
  const styleNodes: StyleSheetDiagnostic[] =
    typeof document === 'undefined'
      ? []
      : Array.from(document.querySelectorAll<HTMLStyleElement>('style[data-styled]'), (node) => ({
          ruleCount: node.sheet?.cssRules.length ?? 0,
          version: node.dataset.styledVersion || undefined,
        }))

  return {styledComponents: {styleNodes, version: styledComponentsVersion}}
}
