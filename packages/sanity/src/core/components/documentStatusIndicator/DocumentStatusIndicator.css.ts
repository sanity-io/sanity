import {style, styleVariants} from '@vanilla-extract/css'
import {getVarName, vars} from '@sanity/ui/css'

import {RELEASE_TYPES_TONES} from '../../releases/util/const'

const tone = {
  asap: RELEASE_TYPES_TONES.asap.tone,
  scheduled: RELEASE_TYPES_TONES.scheduled.tone,
  undecided: RELEASE_TYPES_TONES.undecided.tone,
}

const baseDotStyle = style({
  width: '5px',
  height: '5px',
  backgroundColor: vars.color.muted.fg,
  borderRadius: '999px',
  boxShadow: `0 0 0 1px ${vars.color.bg}`,
  selectors: {
    '&[data-status="published"]': {
      [getVarName(vars.color.muted.fg)]: vars.color.solid.positive.bg[0],
    },
    '&[data-status="draft"]': {
      [getVarName(vars.color.muted.fg)]: vars.color.solid.caution.bg[0],
    },
    '&[data-status="asap"]': {
      [getVarName(vars.color.muted.fg)]: vars.color.solid[tone.asap].bg[0],
    },
    '&[data-status="undecided"]': {
      [getVarName(vars.color.muted.fg)]: vars.color.solid[tone.undecided].bg[0],
    },
    '&[data-status="scheduled"]': {
      [getVarName(vars.color.muted.fg)]: vars.color.solid[tone.scheduled].bg[0],
    },
  },
})

// Create variants for different z-index values
export const dotStyles = styleVariants(
  Array.from({length: 10}, (_, i) => i + 1),
  (index) => [
    baseDotStyle,
    style({
      zIndex: index,
    }),
  ],
)
