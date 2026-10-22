import {css} from '#styled-system/css'

export const root = css({
  // The subjects below are descendants, so they are nested selectors under `root`. The root
  // class is doubled so that each `display` override beats the primitive's own `display` rule by
  // specificity instead of sheet order: TabList (Inline) uses `&&:not([hidden])` (0,3,0) and Select
  // uses `&:not([hidden])` (0,2,0); the previous runtime-injected rules won those ties by order.
  /* Hide on small screens */
  "&&[data-eq-max~='0'] [data-ui='TabList']": {
    display: 'none',
  },
  /* Hide on medium to large screens */
  "&& [data-ui='Select']": {
    display: 'none',
  },
  /* Show on small screens */
  "&&[data-eq-max~='0'] [data-ui='Select']": {
    display: 'block',
  },
})
