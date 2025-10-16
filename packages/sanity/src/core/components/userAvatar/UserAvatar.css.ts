import {vars} from '@sanity/ui/css'
import {style} from '@vanilla-extract/css'

// Create a recipe for different avatar sizes
export const avatarSkeletonStyle = style({
  borderRadius: '50%',
})

export const avatarSkeletonSizeStyles = {
  0: style({
    width: vars.avatar.scale[0].size,
    height: vars.avatar.scale[0].size,
  }),
  1: style({
    width: vars.avatar.scale[1].size,
    height: vars.avatar.scale[1].size,
  }),
  2: style({
    width: vars.avatar.scale[2].size,
    height: vars.avatar.scale[2].size,
  }),
  3: style({
    width: vars.avatar.scale[3].size,
    height: vars.avatar.scale[3].size,
  }),
}
