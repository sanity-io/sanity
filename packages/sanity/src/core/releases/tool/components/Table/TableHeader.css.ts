import {globalStyle, style} from '@vanilla-extract/css'

export const headerSortButton = style({})

// Column headers are semibold so the header row reads clearly as a header, distinct from the row
// content below — especially on sparse, single-column tables. For sortable headers (rendered as a
// button, whose label weight isn't a prop) the same weight is forced onto the inner Text.
globalStyle(`${headerSortButton} [data-ui='Text']`, {
  fontWeight: 600,
})
