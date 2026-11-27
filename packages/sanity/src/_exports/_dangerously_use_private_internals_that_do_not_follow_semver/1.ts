/**
 * Private internals of `sanity` that a studio needs before the user has signed in: the ones that
 * render or embed the studio, and the few that plugins a studio config imports load at module
 * scope.
 *
 * A studio loads its config, and every module the config imports, before it renders the login
 * screen. Importing `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (or any
 * of its other subpaths) from that graph makes every studio download the whole entry before it can
 * show the login screen, so the code that runs up front imports from this subpath instead, and
 * this subpath stays small. Code that only runs after sign-in (a tool, an input, a document
 * action) imports from the other subpaths, ideally behind a lazy import. The `first-load` test in
 * the `@repo/test-exports` workspace checks a built studio's login graph for this.
 *
 * Every export can change or disappear in any release, including patch releases, without notice,
 * without a deprecation period and without being mentioned in the changelog. The contract of
 * `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` applies here too.
 */

export {TextWithTone, type TextWithToneProps} from '../../core/components/textWithTone/TextWithTone'
export {useSchema} from '../../core/hooks/useSchema'
export {
  StudioDiagnosticsBridge,
  type StudioDiagnosticsBridgeApi,
} from '../../core/studio/diagnostics/StudioDiagnosticsBridge'
export {Studio} from '../../core/studio/Studio'
export {StudioLayout} from '../../core/studio/StudioLayout'
export {StudioProvider} from '../../core/studio/StudioProvider'
