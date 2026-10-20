// The global pill shape (docs/initiatives/curation-perspective-selector/SHAPE-TOKEN.md): Round = the shipped full-radius pill,
// Box = 3px. The Design options window sets the CSS variable `--v2-pill-radius` (999px or 3px); these rules make the Variants 2.0
// pieces read it. Stock Studio controls outside these pieces keep their own radius. With Round the variable is 999px, which is
// what the pieces use anyway, so nothing changes by default.
const R = 'var(--v2-pill-radius, 999px)'

// Bound: the version pill at the top right (and its chevron), the address row's chips (dimension, pending and version chips and
// their segments' outer shape), the Variants button of option B, and the C2 pills in the document header.
// Not bound, because they are not pills in the shipped design: the C3 list mark (an icon control), the C7 banners and hint (cards
// with a 6px radius), the field marks (a rhombus), and the inventory panel's status dots.
const RULES = `
[data-ui="ReleasesNav"],
[data-ui="ReleasesNav"] button,
[data-testid^="chip-"]:not([data-testid$="-remove"]),
[data-testid="row-version"],
[data-testid="row-choose"],
[data-testid="variants-button"],
[data-testid^="doc-pills-"] button { border-radius: ${R} !important; }
`

export function ShapeStyles() {
  return <style data-testid="shape-styles">{RULES}</style>
}
