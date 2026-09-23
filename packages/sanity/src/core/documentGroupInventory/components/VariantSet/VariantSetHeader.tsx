import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {VariantSetEntry} from './VariantSetEntry'
import {radius3Var, variantSetHeader} from './VariantSetHeader.css'

export function VariantSetHeader(props: ComponentProps<typeof VariantSetEntry>) {
  const {className, style, ...rest} = props
  const {radius} = useThemeV2()

  return (
    <VariantSetEntry
      {...rest}
      className={clsx(variantSetHeader, className)}
      style={{
        ...assignInlineVars({
          [radius3Var]: `${radius[3]}px`,
        }),
        ...style,
      }}
    />
  )
}
