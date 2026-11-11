// Ported from Andrej's version inventory side panel in the Storybook Variants 2.0 branch (sanity-labs/sanity-studio-storybook,
// explorations/inventory-sidepanel (PR #47), commit 10f3f729a9, lib/explorations/variants/inventory-concepts/CreateVariantIcon.tsx).
// Changes: imports point at this monorepo and ./fixtures (a LIVE replacement of his fixtures); LIVE: marks other changes.
// RhombusAddIcon is copied from comparison-surfaces/content-variants/PersonalizationIcons.tsx.
import {type SVGProps} from 'react'

/**
 * The icon on every button that adds or creates a variant in the inventory (Andrej, 2026-10-21:
 * "Please exchange the icon to the rhombus add in the add variant buttons"): the rhombus-add, drawn
 * at three quarters of its size. At full size its ink is 13.4 px in the 21 px box, against 10.1 px
 * for the expand icon beside it in the panel header; at 0.75 it is 10.1 px. The box stays 21 px,
 * so the button keeps its size and centre line. The viewBox grows by a third around the centre
 * instead of a CSS transform, so the glyph stays crisp and its box does not move.
 */
export function CreateVariantIcon(props: SVGProps<SVGSVGElement>) {
  return <RhombusAddIcon viewBox="-3.5 -3.5 28 28" {...props} />
}

export function RhombusAddIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      data-sanity-icon="rhombus-add"
      width="1em"
      height="1em"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M17.22 10.5L10.5 3.78L3.78003 10.5L10.5 17.22"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M16.8 13.86H13.86M13.86 13.86H10.92M13.86 13.86V10.92M13.86 13.86V16.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
