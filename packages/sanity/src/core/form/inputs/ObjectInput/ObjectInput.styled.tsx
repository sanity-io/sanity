import {Card, Grid, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {
  alignedBottomGrid,
  fieldGroupTabsWrapper,
  fieldGroupTabsWrapperMarginBottomVar,
  fieldGroupTabsWrapperPaddingBottomVar,
} from './ObjectInput.css'

// The negative margins here removes the extra space between the tabs and the fields when inside of a grid
export function FieldGroupTabsWrapper(props: ComponentProps<typeof Card> & {$level?: number}) {
  const {$level, className, style, ...rest} = props
  const {space} = useThemeV2()

  return (
    <Card
      {...rest}
      className={clsx(fieldGroupTabsWrapper, className)}
      style={{
        ...assignInlineVars({
          [fieldGroupTabsWrapperMarginBottomVar]: `${$level === 0 ? 0 : space[5] * -1}px`,
          [fieldGroupTabsWrapperPaddingBottomVar]: `${space[4]}px`,
        }),
        ...style,
      }}
    />
  )
}

export function AlignedBottomGrid(props: ComponentProps<typeof Grid>) {
  const {className, ...rest} = props

  return <Grid {...rest} className={clsx(alignedBottomGrid, className)} />
}
