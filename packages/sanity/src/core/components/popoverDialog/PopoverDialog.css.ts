import {style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

export const stickyLayerStyle = style({
  position: 'sticky',
  top: 0,
  width: '100%',
  background: vars.color.bg,
  borderBottom: `1px solid ${vars.color.border}`,
  borderTopLeftRadius: vars.radius[3],
  borderTopRightRadius: vars.radius[3],
})
