import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ElementType} from 'react'

import {space3Var, variantSetEntry} from './VariantSetEntry.css'

export function VariantSetEntry(props: ComponentProps<'div'> & {as?: ElementType}) {
  const {as: Component = 'div', className, style, ...rest} = props
  const {space} = useThemeV2()

  return (
    <Component
      {...rest}
      className={clsx(variantSetEntry, className)}
      style={{
        ...assignInlineVars({
          [space3Var]: `${space[3]}px`,
        }),
        ...style,
      }}
    />
  )
}
