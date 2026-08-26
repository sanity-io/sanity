import {Grid, type GridProps, rem, useTheme} from '@sanity/ui'
import {type HTMLProps, type ReactNode, useMemo, type RefAttributes} from 'react'
import {Flex, type FlexProps} from 'ui5'

import {FromToArrow} from './FromToArrow'

/** @internal */
export type FromToProps = {
  align?: 'top' | 'center' | 'bottom'
  layout?: 'grid' | 'inline'
  from?: ReactNode
  to?: ReactNode
} & Omit<HTMLProps<HTMLDivElement>, 'children' | 'as' | 'height' | 'wrap'>

const INLINE_COLUMN_STYLES = {flexShrink: 0}
const BLOCK_COLUMN_STYLES = {alignItems: 'stretch'}

const FLEX_ALIGN: Record<string, 'flex-start' | 'center' | 'flex-end'> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
  default: 'flex-start',
}

/** @internal */
export function FromTo(props: FromToProps & RefAttributes<HTMLDivElement>) {
  const {ref, align = 'top', layout = 'inline', from, to, style, ...restProps} = props
  const theme = useTheme()

  const layoutStyles = useMemo(
    () => ({
      ...style,
      ...(layout === 'inline'
        ? {maxWidth: '100%', display: 'inline-flex'}
        : // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
          {gridTemplateColumns: `minmax(0, 1fr) ${rem(theme.sanity.space[5])} minmax(0, 1fr)`}),
    }),
    [layout, style, theme],
  )

  const columnStyles = layout === 'inline' ? INLINE_COLUMN_STYLES : BLOCK_COLUMN_STYLES

  const children = (
    <>
      {from && (
        <>
          <Flex alignItems={FLEX_ALIGN[align]} style={columnStyles}>
            {from}
          </Flex>
          <Flex alignItems="center" justifyContent="center" padding={2}>
            <FromToArrow />
          </Flex>
        </>
      )}
      <Flex alignItems={FLEX_ALIGN[align]} style={columnStyles}>
        {to}
      </Flex>
    </>
  )

  if (layout === 'inline') {
    return (
      <Flex {...(restProps as FlexProps)} ref={ref} style={layoutStyles} data-from-to-layout>
        {children}
      </Flex>
    )
  }

  // Cast: HTMLProps is not assignable to GridProps because Grid marks legacy
  // `columns`/`rows` as `never` under @sanity/ui v4.
  return (
    <Grid {...(restProps as GridProps)} ref={ref} style={layoutStyles} data-from-to-layout>
      {children}
    </Grid>
  )
}
