import {useLayoutEffect} from 'react'

const STYLE_ID = 'sanity-view-transition-styles'

/** Width morph duration. The date chip holds the slot for this long on exit. */
export const VIEW_TRANSITION_WIDTH_MS = 300

/**
 * View-transition classes for the studio's layout moves.
 *
 * A view transition paints the old and new boxes as snapshots, so a width or
 * slide change does not relayout on every frame. The group carries the size
 * change. The snapshots keep their own size (`object-fit: none`) so text and
 * chrome are clipped by the group instead of stretched.
 *
 * Curves stand in for the springs these moves used to run on: a critically
 * damped drawer (`cubic-bezier(0.32, 0.72, 0, 1)`), and an ease-out
 * (`cubic-bezier(0.23, 1, 0.32, 1)`) for fades. Width keeps the curve the CSS
 * transition already used.
 */
const CSS = `
/* The snapshot overlay covers the viewport. Clicks pass through to the page. */
::view-transition { pointer-events: none }

@keyframes sanity-vt-fade-in { from { opacity: 0 } }
@keyframes sanity-vt-fade-out { to { opacity: 0 } }
@keyframes sanity-vt-pop-in { from { opacity: 0; scale: 0.97 } }
@keyframes sanity-vt-pop-out { to { opacity: 0; scale: 0.98 } }
@keyframes sanity-vt-drawer-in { from { transform: translateX(-100%) } }
@keyframes sanity-vt-drawer-out { to { transform: translateX(-100%) } }
@keyframes sanity-vt-drawer-end-in { from { transform: translateX(100%) } }
@keyframes sanity-vt-drawer-end-out { to { transform: translateX(100%) } }
@keyframes sanity-vt-width-in { from { width: 0 } }
@keyframes sanity-vt-width-out { to { width: 0 } }
@keyframes sanity-vt-reveal-end-in {
  from { clip-path: inset(0 0 0 100%) }
  to { clip-path: inset(0 0 0 0) }
}
@keyframes sanity-vt-reveal-end-out {
  from { clip-path: inset(0 0 0 0) }
  to { clip-path: inset(0 0 0 100%) }
}

::view-transition-group(.sanity-vt-width) {
  animation-duration: ${VIEW_TRANSITION_WIDTH_MS}ms;
  animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
  overflow: clip;
}
::view-transition-image-pair(.sanity-vt-width) { overflow: clip }
::view-transition-old(.sanity-vt-width),
::view-transition-new(.sanity-vt-width) {
  height: 100%;
  width: auto;
  object-fit: none;
  object-position: left center;
  overflow: clip;
}

::view-transition-group(.sanity-vt-width-in) {
  animation: sanity-vt-width-in ${VIEW_TRANSITION_WIDTH_MS}ms cubic-bezier(0.25, 1, 0.5, 1) both;
  overflow: clip;
}
::view-transition-group(.sanity-vt-width-out) {
  animation: sanity-vt-width-out ${VIEW_TRANSITION_WIDTH_MS}ms cubic-bezier(0.25, 1, 0.5, 1) both;
  overflow: clip;
}
::view-transition-image-pair(.sanity-vt-width-in),
::view-transition-image-pair(.sanity-vt-width-out) { overflow: clip }
::view-transition-old(.sanity-vt-width-in),
::view-transition-new(.sanity-vt-width-in),
::view-transition-old(.sanity-vt-width-out),
::view-transition-new(.sanity-vt-width-out) {
  height: 100%;
  width: auto;
  object-fit: none;
  object-position: left center;
  overflow: clip;
}

/*
 * A pill's own picture is its outline and background; its label and controls are captured on
 * their own. Only the new picture shows, stretched to the group, and the group clips it to a
 * pill, so the outline stays closed at every width while the controls move inside it.
 */
::view-transition-group(.sanity-vt-pill) {
  animation-duration: ${VIEW_TRANSITION_WIDTH_MS}ms;
  animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
  border-radius: 9999px;
  overflow: clip;
}
::view-transition-old(.sanity-vt-pill) { animation: none; opacity: 0 }
::view-transition-new(.sanity-vt-pill) {
  animation: none;
  width: 100%;
  height: 100%;
  object-fit: fill;
}

/*
 * A panel docked to the end of a row that pushes a neighbour aside: it is uncovered from its end
 * edge, on the width curve, so its start edge stays against the neighbour as that one morphs.
 */
::view-transition-new(.sanity-vt-reveal-end) {
  animation: sanity-vt-reveal-end-in ${VIEW_TRANSITION_WIDTH_MS}ms cubic-bezier(0.25, 1, 0.5, 1) both;
}
::view-transition-old(.sanity-vt-reveal-end) {
  animation: sanity-vt-reveal-end-out ${VIEW_TRANSITION_WIDTH_MS}ms cubic-bezier(0.25, 1, 0.5, 1) both;
}

/* A control that keeps its size and moves with a resizing neighbour: the default slide, on the
   width curve so it stays against the neighbour's edge. Not clipped, so ink outside its box shows. */
::view-transition-group(.sanity-vt-move) {
  animation-duration: ${VIEW_TRANSITION_WIDTH_MS}ms;
  animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
}

::view-transition-group(.sanity-vt-fade) { animation: none }
::view-transition-new(.sanity-vt-fade) {
  animation: sanity-vt-fade-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
::view-transition-old(.sanity-vt-fade) {
  animation: sanity-vt-fade-out 160ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

/*
 * A change of look in place, like a pulse easing out: the new picture fades in over the old one,
 * which stays as it is underneath, so the element goes from its old pixels to its new ones
 * without fading through a lighter frame.
 */
::view-transition-group(.sanity-vt-settle) { animation: none }
::view-transition-old(.sanity-vt-settle) { animation: none }
::view-transition-new(.sanity-vt-settle) {
  animation: sanity-vt-fade-in ${VIEW_TRANSITION_WIDTH_MS}ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

::view-transition-group(.sanity-vt-pop) { animation: none }
::view-transition-new(.sanity-vt-pop) {
  animation: sanity-vt-pop-in 320ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
::view-transition-old(.sanity-vt-pop) {
  animation: sanity-vt-pop-out 220ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

::view-transition-group(.sanity-vt-drawer) { animation: none }
::view-transition-new(.sanity-vt-drawer) {
  animation: sanity-vt-drawer-in 320ms cubic-bezier(0.32, 0.72, 0, 1) both;
}
::view-transition-old(.sanity-vt-drawer) {
  animation: sanity-vt-drawer-out 280ms cubic-bezier(0.32, 0.72, 0, 1) both;
}

::view-transition-group(.sanity-vt-drawer-end) { animation: none }
::view-transition-new(.sanity-vt-drawer-end) {
  animation: sanity-vt-drawer-end-in 320ms cubic-bezier(0.32, 0.72, 0, 1) both;
}
::view-transition-old(.sanity-vt-drawer-end) {
  animation: sanity-vt-drawer-end-out 280ms cubic-bezier(0.32, 0.72, 0, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(.sanity-vt-width),
  ::view-transition-old(.sanity-vt-width),
  ::view-transition-new(.sanity-vt-width),
  ::view-transition-group(.sanity-vt-width-in),
  ::view-transition-group(.sanity-vt-width-out),
  ::view-transition-old(.sanity-vt-width-in),
  ::view-transition-new(.sanity-vt-width-in),
  ::view-transition-old(.sanity-vt-width-out),
  ::view-transition-new(.sanity-vt-width-out),
  ::view-transition-group(.sanity-vt-pill),
  ::view-transition-old(.sanity-vt-reveal-end),
  ::view-transition-new(.sanity-vt-reveal-end),
  ::view-transition-group(.sanity-vt-move),
  ::view-transition-old(.sanity-vt-move),
  ::view-transition-new(.sanity-vt-move),
  ::view-transition-group(.sanity-vt-fade),
  ::view-transition-old(.sanity-vt-fade),
  ::view-transition-new(.sanity-vt-fade),
  ::view-transition-group(.sanity-vt-settle),
  ::view-transition-old(.sanity-vt-settle),
  ::view-transition-new(.sanity-vt-settle),
  ::view-transition-group(.sanity-vt-pop),
  ::view-transition-old(.sanity-vt-pop),
  ::view-transition-new(.sanity-vt-pop),
  ::view-transition-group(.sanity-vt-drawer),
  ::view-transition-old(.sanity-vt-drawer),
  ::view-transition-new(.sanity-vt-drawer),
  ::view-transition-group(.sanity-vt-drawer-end),
  ::view-transition-old(.sanity-vt-drawer-end),
  ::view-transition-new(.sanity-vt-drawer-end) {
    animation-duration: 0s !important;
  }
}
`

function injectViewTransitionStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

if (typeof document !== 'undefined') injectViewTransitionStyles()

/** Injects the shared view-transition stylesheet once a caller has mounted. */
export function useViewTransitionStyles(): void {
  useLayoutEffect(() => {
    injectViewTransitionStyles()
  }, [])
}
