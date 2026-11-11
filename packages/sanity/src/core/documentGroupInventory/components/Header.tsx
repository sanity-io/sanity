import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

export const Header = styled.div(({theme}) => {
  const {space} = getThemeV2(theme)

  return css`
    flex: none;
    min-inline-size: 0;
    padding-inline: ${space[4]}px;
    padding-block-start: ${space[4]}px;
    padding-block-end: calc(${space[5]}px * 0.5);

    &,
    .atom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: ${space[2]}px;
    }

    /*
     * Both toolbar modes (create version / selection) must be the same height so the list
     * below doesn't shift when selection mode toggles. The legacy and Ui5 buttons differ by
     * about half a pixel, so pin the row to the taller of the two.
     */
    > .atom {
      min-block-size: 26px;
    }
  `
})
