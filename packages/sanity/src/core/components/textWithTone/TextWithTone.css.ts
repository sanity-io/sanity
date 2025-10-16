import {style} from '@vanilla-extract/css'
import {getVarName, vars} from '@sanity/ui/css'

export const textWithToneStyle = style({
  selectors: {
    '&:not([data-muted])[data-tone="default"]': {
      [getVarName(vars.color.fg)]: vars.color.solid.default.fg[0],
    },
    '&:not([data-muted])[data-tone="primary"]': {
      [getVarName(vars.color.fg)]: vars.color.solid.primary.fg[0],
    },
    '&:not([data-muted])[data-tone="positive"]': {
      [getVarName(vars.color.fg)]: vars.color.solid.positive.fg[0],
    },
    '&:not([data-muted])[data-tone="caution"]': {
      [getVarName(vars.color.fg)]: vars.color.solid.caution.fg[0],
    },
    '&:not([data-muted])[data-tone="critical"]': {
      [getVarName(vars.color.fg)]: vars.color.solid.critical.fg[0],
    },
    '&[data-dimmed]': {
      opacity: 0.3,
    },
  },
})
