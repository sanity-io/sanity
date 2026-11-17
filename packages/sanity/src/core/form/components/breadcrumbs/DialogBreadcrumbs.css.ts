import {css} from '#styled-system/css'

/** Caps a crumb so a long title ellipsizes instead of pushing its siblings out. */
export const breadcrumbItem = css({maxWidth: '250px'})

/**
 * `PressArea` has no hover state of its own, so the surface inside it shows the hover
 * feedback the breadcrumbs had as bleed buttons. The rule keys on the `data-ui` attribute
 * `PressArea` already renders.
 */
export const breadcrumbSurface = css({
  '[data-ui="PressArea"]:hover > &': {
    backgroundColor: 'var(--background-low)',
  },
})
