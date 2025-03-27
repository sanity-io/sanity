import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

/**
 * @internal
 */
export const FormContainer = styled.div`
    box-sizing: border-box;
    margin-inline: auto;
    padding-inline: ${vars.space[4]}px;
    padding-block-start: ${vars.space[5]}px;
    padding-block-end: ${vars.space[9]}px;
    max-width: calc(${vars.container[1]}px + (var(--formGutterSize, 0px) * 2) + (var(--formGutterGap, 0px) * 2));
  `
