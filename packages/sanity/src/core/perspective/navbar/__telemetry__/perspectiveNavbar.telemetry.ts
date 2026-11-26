import {defineEvent} from '@sanity/telemetry'

interface PerspectiveDetailLinkClickedInfo {
  perspective: 'release' | 'variant'
}

/** When the detail link next to a release or variant in a navbar perspective menu is followed */
export const PerspectiveDetailLinkClicked = defineEvent<PerspectiveDetailLinkClickedInfo>({
  name: 'Perspective Detail Link Clicked',
  version: 1,
  description:
    'User opened the detail page of a release or variant from its row in a navbar perspective menu',
})
