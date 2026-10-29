import {getTheme_v2} from '@sanity/ui/theme'
import {css, type DefaultTheme} from 'styled-components'

/**
 * Declares the custom properties that control the form gutter.
 *
 * @internal
 */
export function formGutterCustomProperties(theme: DefaultTheme) {
  const {space} = getTheme_v2(theme)

  return css`
    --formGutterSize: 0px;
    --formGutterGap: 0px;

    &[data-gutter='true'] {
      --formGutterSize: ${space[4]}px;
      --formGutterGap: ${space[3]}px;
    }
  `
}
