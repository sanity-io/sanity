// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

/**
 * @internal
 */
export const FormContainer = styled.div((props) => {
  const {space, container} = getTheme_v2(props.theme)

  return css`
    box-sizing: border-box;
    margin-inline: auto;
    padding-inline: ${space[4]}px;
    padding-block-start: ${space[5]}px;
    padding-block-end: ${space[9]}px;
    max-width: calc(
      ${container[1]}px + (var(--formGutterSize, 0px) * 2) + (var(--formGutterGap, 0px) * 2)
    );
  `
})
