import {type Path} from '@sanity/types'
import {type LayerContextValue, Card, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type CSSProperties} from 'react'

import {pathToAnchorIdent} from '../../form/utils/pathToAnchorIdent'
import {
  anchorNameVar,
  divergenceOverlay,
  space3Var,
  space5Var,
  zIndexVar,
} from './DivergenceOverlay.css'

interface Props {
  $path: Path
  $layer: LayerContextValue
}

/**
 * @internal
 */
export function DivergenceOverlay(props: ComponentProps<typeof Card> & Props) {
  const {$layer, $path, className, style, ...rest} = props
  const {space} = useThemeV2()

  return (
    <Card
      {...rest}
      className={clsx(divergenceOverlay, className)}
      style={
        {
          [space3Var]: `${space[3]}px`,
          [space5Var]: `${space[5]}px`,
          [anchorNameVar]: pathToAnchorIdent('input', $path),
          [zIndexVar]: `${$layer.zIndex}`,
          ...style,
        } as CSSProperties
      }
    />
  )
}
