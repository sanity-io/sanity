// The colour system for a perspective (spec N1, N2, P2, B2; Figma O5e): the state is said by a base and an icon colour. Drafts = caution, Published =
// positive, a release = neutral (not yet live, so lower in the hierarchy than green). Purple is for variants only. The colours are theme variables, so
// they must be read from inside the theme (a portal loses them).
export interface StateTone {
  /** The base of a set (a pill-shaped section). */
  bg: string
  /** The cube outline, and the top face of a filled cube. */
  icon: string
  /** The two lower faces of a filled cube: a light tint of the icon colour. */
  tint: string
}

export function stateToneOf(perspective: string | undefined): StateTone {
  // The stock navbar names no perspective for Drafts (it is the default), so a missing name is Drafts too.
  const name =
    perspective === undefined || perspective === 'drafts'
      ? 'caution'
      : perspective === 'published'
        ? 'positive'
        : 'default'
  return {
    bg: `var(--card-badge-${name}-bg-color)`,
    icon: `var(--card-badge-${name}-icon-color)`,
    tint: `color-mix(in srgb, var(--card-badge-${name}-icon-color) 28%, var(--card-bg-color))`,
  }
}

/** The 1.5 px outline that says "this is not the global set" (B2): the text colour, a cue that does not rely on hue. */
export const LOCAL_OUTLINE = 'inset 0 0 0 1.5px var(--card-fg-color)'
