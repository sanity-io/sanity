import {css} from '#styled-system/css'

export const dateWithTooltipElementQuery = css({
  // `.date-small` / `.date-medium` / `.date-large` are plain spans, so the descendant rules only
  // compete with each other. The breakpoint blocks share a specificity and must stay in ascending
  // order: an element past `media[2]` also carries `1` in `data-eq-min`, and the later rule wins.
  '& .date-small': {
    display: 'inline',
  },
  '& .date-medium': {
    display: 'none',
  },
  '& .date-large': {
    display: 'none',
  },
  "&[data-eq-min~='1'] .date-small": {
    display: 'none',
  },
  "&[data-eq-min~='1'] .date-medium": {
    display: 'inline',
  },
  "&[data-eq-min~='1'] .date-large": {
    display: 'none',
  },
  "&[data-eq-min~='2'] .date-small": {
    display: 'none',
  },
  "&[data-eq-min~='2'] .date-medium": {
    display: 'none',
  },
  "&[data-eq-min~='2'] .date-large": {
    display: 'inline',
  },
})
