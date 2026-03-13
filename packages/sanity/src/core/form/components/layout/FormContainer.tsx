import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

/**
 * @internal
 */
export const FormContainer = styled.div`
    box-sizing: border-box;
    margin-inline: auto;
    padding-inline: ${vars.space[4]};
    padding-block-start: ${vars.space[5]};
    padding-block-end: ${vars.space[9]};
    max-width: calc(${vars.container[1]} + (var(--formGutterSize, 0px) * 2) + (var(--formGutterGap, 0px) * 2));
  `
