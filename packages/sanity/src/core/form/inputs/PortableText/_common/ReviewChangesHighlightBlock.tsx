import {vars} from '@sanity/ui/css'
import {css, styled} from 'styled-components'

export const ReviewChangesHighlightBlock = styled.div<{
  $fullScreen: boolean
}>(({$fullScreen}) => {
  return css`
    position: absolute;
    border-radius: ${vars.radius[3]};
    top: calc(0px - ${vars.space[2]});
    bottom: calc(0px - ${vars.space[1]} + ${vars.space[1]});
    left: ${$fullScreen ? `calc(${vars.space[4]} + ${vars.space[1]})` : vars.space[1]};
    right: ${vars.space[1]};
    background-color: color-mix(in srgb, transparent, ${vars.color.solid.caution.bg[0]} 20%);
    pointer-events: none;
  `
})
