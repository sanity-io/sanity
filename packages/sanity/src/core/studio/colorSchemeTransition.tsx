import {addTransitionType, startTransition, ViewTransition, type ViewTransitionClass} from 'react'
import {createPortal} from 'react-dom'

// Styled by the `::view-transition-*` rules in the package's global CSS
const COLOR_SCHEME_TRANSITION = 'sanity-color-scheme'

const COLOR_SCHEME_MARKER: ViewTransitionClass = {
  default: 'none',
  [COLOR_SCHEME_TRANSITION]: 'sanity-color-scheme',
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Applies a color scheme change in a transition of the `sanity-color-scheme` type, which the
 * browser crossfades. With reduced motion the change applies as a plain update.
 *
 * @internal
 */
export function startColorSchemeTransition(update: () => void): void {
  if (prefersReducedMotion()) {
    update()
    return
  }
  startTransition(() => {
    addTransitionType(COLOR_SCHEME_TRANSITION)
    update()
  })
}

/**
 * Mounted in the same transition as a scheme change, so a portal inside a `<ViewTransition>`
 * boundary enters with it. React then starts a view transition and keeps the snapshot of the
 * document root, and the whole page crossfades as one picture: portaled popovers, dialogs and
 * toasts included, in the order they stack. A boundary around the Studio itself would picture it
 * apart from the root and above it, hiding every portal until the crossfade ends.
 *
 * Kept mounted, the boundary would also start a view transition whenever an unrelated transition
 * or Suspense reveal mounts or unmounts it, so it is only rendered while a scheme change commits.
 *
 * @internal
 */
export function ColorSchemeTransitionMarker() {
  return (
    <ViewTransition default={COLOR_SCHEME_MARKER}>
      {createPortal(<div hidden data-sanity-color-scheme-transition="" />, document.body)}
    </ViewTransition>
  )
}
