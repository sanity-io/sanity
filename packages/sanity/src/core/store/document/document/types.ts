/** @internal */
export interface DocumentTarget {
  baseId: string
  /**
   * The version of the document.
   * Can be a release document ID, `"drafts"`, or `"published"`.
   * If a release document ID, it will be resolved to the release document ID. (eg. `_.releases.r8LxQ9fg6`)
   * If `"drafts"`, it will be resolved to the drafts document ID.
   * If `"published"`, it will be resolved to the published document ID.
   */
  version: 'drafts' | 'published' | (string & {})
  /**
   * The variant of the document.
   * Can be a variant document ID, or `undefined` if the document is not a variant.
   */
  variant?: string
}
