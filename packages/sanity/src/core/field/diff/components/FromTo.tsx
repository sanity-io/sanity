import React, {forwardRef, useMemo} from 'react'
import {Flex, Grid, rem, useTheme} from '@sanity/ui'
import {FromToArrow} from './FromToArrow'

/** @internal */
export type FromToProps = {
  align?: 'top' | 'center' | 'bottom'
  layout?: 'grid' | 'inline'
  from?: React.ReactNode
  to?: React.ReactNode
} & Omit<React.HTMLProps<HTMLDivElement>, 'children' | 'as' | 'height' | 'wrap'>

const INLINE_COLUMN_STYLES = {flexShrink: 0}
const BLOCK_COLUMN_STYLES = {alignItems: 'stretch'}

const FLEX_ALIGN: Record<string, 'flex-start' | 'center' | 'flex-end'> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
  default: 'flex-start',
}

/** @internal */
export const FromTo = forwardRef<HTMLDivElement, FromToProps>(function FromTo(props, ref) {
  const {align = 'top', layout = 'inline', from, to, style, ...restProps} = props
  const theme = useTheme()

  const Layout = layout === 'inline' ? Flex : Grid
  const layoutStyles = useMemo(
    () => ({
      ...style,
      ...(layout === 'inline'
        ? {maxWidth: '100%', display: 'inline-flex'}
        : {gridTemplateColumns: `minmax(0, 1fr) ${rem(theme.sanity.space[5])} minmax(0, 1fr)`}),
    }),
    [layout, style, theme]
  )

  const columnStyles = layout === 'inline' ? INLINE_COLUMN_STYLES : BLOCK_COLUMN_STYLES

  return (
    <Layout {...restProps} ref={ref} style={layoutStyles} data-from-to-layout>
      {from && (
        <>
          <Flex align={FLEX_ALIGN[align]} style={columnStyles}>
            {from}
          </Flex>
          <Flex align="center" justify="center" padding={2}>
            <FromToArrow />
          </Flex>
        </>
      )}
      <Flex align={FLEX_ALIGN[align]} style={columnStyles}>
        {to}
      </Flex>
    </Layout>
  )
})
