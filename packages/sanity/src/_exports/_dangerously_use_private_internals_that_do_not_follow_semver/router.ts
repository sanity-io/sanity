/**
 * Private internals of `sanity/router` that do not follow semver.
 *
 * Everything exported from this entry is tagged `@internal`, `@hidden` or `@deprecated`: it is
 * exported because the Studio's own tools and plugins need it, not because it is meant to be used
 * by studios or third-party plugins. Every export can change or disappear in any release,
 * including patch releases, without notice, without a deprecation period and without being
 * mentioned in the changelog. The contract of
 * `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` applies here too.
 */

export {
  type InternalSearchParam,
  type MatchError,
  type MatchOk,
  type MatchResult,
  type NextStateOrOptions,
} from '../../router/types'
export {RouterContext} from '../../router/useRouter'
