import {type ViewTransitionClass, type ViewTransitionClassPerType} from 'react'

/**
 * Transition type that keeps every `<ViewTransition>` boundary of the studio's own out of a
 * transition, so an app or a plugin can take full control of the animation and of where its
 * boundaries are. Add it with `addTransitionType` inside `startTransition`; it wins over any other
 * type of the same transition, including the studio's own.
 *
 * @example
 * ```tsx
 * import {addTransitionType, startTransition} from 'react'
 * import {STUDIO_SKIP_TRANSITION_TYPE} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1'
 *
 * startTransition(() => {
 *   addTransitionType(STUDIO_SKIP_TRANSITION_TYPE)
 *   addTransitionType('my-plugin-reveal')
 *   setRevealed(true)
 * })
 * ```
 *
 * @internal
 */
export const STUDIO_SKIP_TRANSITION_TYPE = 'sanity-studio-skip'

/**
 * Transition type for a change that resizes the studio's layout: opening or closing a side panel,
 * splitting panes, resizing a panel or switching the preview viewport. The studio adds it to the
 * resizes it runs as transitions, so a plugin's `<ViewTransition>` boundaries can opt in to animate
 * along with them, and a plugin adds it to its own layout changes so the studio's boundaries that
 * support resizing animate with them.
 *
 * @example
 * ```tsx
 * import {addTransitionType, startTransition, ViewTransition} from 'react'
 * import {STUDIO_RESIZE_TRANSITION_TYPE} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1'
 *
 * function openPanel() {
 *   startTransition(() => {
 *     addTransitionType(STUDIO_RESIZE_TRANSITION_TYPE)
 *     setPanelOpen(true)
 *   })
 * }
 *
 * function Panel(props: {children: React.ReactNode}) {
 *   return (
 *     <ViewTransition default={{default: 'none', [STUDIO_RESIZE_TRANSITION_TYPE]: 'auto'}}>
 *       <aside>{props.children}</aside>
 *     </ViewTransition>
 *   )
 * }
 * ```
 *
 * @internal
 */
export const STUDIO_RESIZE_TRANSITION_TYPE = 'sanity-studio-resize'

/**
 * Transition type for a change of the studio's color scheme: flipping between dark and light, or a
 * plugin applying a new scheme or theme. Add it when changing the scheme inside `startTransition`,
 * and key a `<ViewTransition>` boundary's classes on it to animate along with the change.
 *
 * @example
 * ```tsx
 * import {addTransitionType, startTransition} from 'react'
 * import {STUDIO_SCHEME_TRANSITION_TYPE} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1'
 *
 * startTransition(() => {
 *   addTransitionType(STUDIO_SCHEME_TRANSITION_TYPE)
 *   applyTheme(nextTheme)
 * })
 * ```
 *
 * @internal
 */
export const STUDIO_SCHEME_TRANSITION_TYPE = 'sanity-studio-scheme'

/**
 * The classes of one of the studio's own `<ViewTransition>` boundaries, keyed by transition type,
 * with `none` for a transition that carries {@link STUDIO_SKIP_TRANSITION_TYPE}. React lets a
 * `none` match win over every other type of the transition, and a boundary's `enter`, `exit`,
 * `update` and `share` classes take over from its `default` one, so every class a boundary passes
 * has to come from here, maps and plain strings alike.
 *
 * @internal
 */
export function studioViewTransitionClass(
  classByType: ViewTransitionClass,
): ViewTransitionClassPerType {
  return {
    ...(typeof classByType === 'string' ? {default: classByType} : classByType),
    [STUDIO_SKIP_TRANSITION_TYPE]: 'none',
  }
}
