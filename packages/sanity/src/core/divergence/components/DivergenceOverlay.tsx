import {type Path} from '@sanity/types'
import {type LayerContextValue, Card} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {pathToAnchorIdent} from '../../form/utils/pathToAnchorIdent'

interface Props {
  $path: Path
  $layer: LayerContextValue
}

/**
 * @internal
 */
export const DivergenceOverlay = styled(Card)<Props>(({$path, $layer, ...props}) => {
  const theme = getTheme_v2(props.theme)

  return css`
    inline-size: 100%;
    margin-block-start: ${theme.space[3]}px;

    @supports (position-anchor: --anchor) {
      position: fixed;
      position-anchor: ${pathToAnchorIdent('input', $path)};
      position-area: block-end span-all;
      position-try-fallbacks: flip-block;
      inline-size: calc(anchor-size(inline) + ${theme.space[5]}px);
      z-index: ${$layer.zIndex};
    }
  `
})
