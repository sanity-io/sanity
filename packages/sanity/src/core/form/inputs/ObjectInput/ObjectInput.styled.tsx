import {Card, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type CSSProperties} from 'react'
import {Grid} from 'ui5'

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
      style={
        {
          [fieldGroupTabsWrapperMarginBottomVar]: `${$level === 0 ? 0 : space[5] * -1}px`,
          [fieldGroupTabsWrapperPaddingBottomVar]: `${space[4]}px`,
          ...style,
        } as CSSProperties
      }
    />
  )
}

export function AlignedBottomGrid(props: ComponentProps<typeof Grid>) {
  const {className, ...rest} = props

  return <Grid {...rest} className={clsx(alignedBottomGrid, className)} />
}
