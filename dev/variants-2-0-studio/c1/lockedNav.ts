// C1 options B, D and E are the open beta navbar: the router's variant param is the one copy of the choice, the navbar stays neutral, the row is gone.
// B draws the two controls as they are (the stock state pill and the Variants pill). D and E group them in one section with the cube; D makes the
// state control one button, E keeps the stock split control (label link plus chevron).
export const isLockedNav = (option: string | undefined): boolean =>
  option === 'b' || option === 'd' || option === 'e'

/** D and E: the global perspective is one grey section. */
export const hasNavSection = (option: string | undefined): boolean =>
  option === 'd' || option === 'e'
