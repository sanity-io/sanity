export {unstable_defineService, unstable_defineView} from '@sanity/cli/runtime'
// Props an `asset_source` view component receives. Sourced from `@sanity/types`
// directly (same shape `@sanity/cli/runtime` re-exports) so authors can type an
// `unstable_defineView('asset_source', …)` component from `sanity/workbench`.
export type {AssetSource, AssetSourceComponentProps} from '@sanity/types'
