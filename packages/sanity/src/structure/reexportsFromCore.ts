/**
 * Compatibility re-exports for APIs that historically lived in `sanity/structure`
 * but have moved to `sanity` (core) as part of making the document pane usable
 * outside the structure tool.
 *
 * The `sanity/structure` entry point keeps exporting these symbols so existing
 * consumers are unaffected. New code should import them from `sanity` instead.
 *
 * Note: this indirection exists because the `sanity/structure` entry file is not
 * allowed to import core modules directly (see the boundaries policy in
 * `.oxlintrc.json`) — but structure source files may import from `sanity`.
 */
export {
  type BackLinkProps,
  type ChildLinkProps,
  type EditReferenceOptions,
  Pane,
  PaneContent,
  PaneLayout,
  PaneRouterContext,
  type PaneRouterContextValue,
  type ParameterizedLinkProps,
  type ReferenceChildLinkProps,
  usePaneRouter,
} from 'sanity'
