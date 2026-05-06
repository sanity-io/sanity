/** @internal */
export interface DocumentTarget {
  baseId: string
  bundleId: 'drafts' | 'published' | (string & {}) // <-- this is for releases
  variantId?: string // corresponds to variant definition
}
