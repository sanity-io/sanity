import {ActivityIcon} from '@sanity/icons/Activity'

// Sanity brand orange; @sanity/icons stroke with `currentColor`, so setting
// the CSS color on the svg is enough to tint the glyph.
const SANITY_ORANGE = '#FF5500'

export function RadarIcon() {
  return <ActivityIcon style={{color: SANITY_ORANGE}} />
}
