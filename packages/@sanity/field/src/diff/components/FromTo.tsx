import React, {forwardRef, useMemo} from 'react'
import {Flex, Grid} from '@sanity/ui'
import {FromToArrow} from './FromToArrow'

export type FromToProps = {
  align?: 'top' | 'center' | 'bottom'
  layout?: 'grid' | 'inline'
  from?: React.ReactNode
  to?: React.ReactNode
} & Omit<React.HTMLProps<HTMLDivElement>, 'children' | 'as' | 'height' | 'wrap'>

export const FromTo = forwardRef<HTMLDivElement, FromToProps>(
  ({align = 'top', layout = 'inline', from, to, style, ...restProps}, ref) => {
    const flexAlign: Record<string, 'flex-start' | 'center' | 'flex-end'> = {
      top: 'flex-start',
      center: 'center',
      bottom: 'flex-end',
      default: 'flex-start',
    }
    const Layout = layout === 'inline' ? Flex : Grid
    const layoutStyles = useMemo(
      () => ({
        ...style,
        ...(layout === 'inline'
          ? {maxWidth: '100%', display: 'inline-flex'}
          : {gridTemplateColumns: `minmax(0, 1fr) 26px minmax(0, 1fr)`}),
      }),
      [layout, style]
    )

    const columnStyles = useMemo(() => (layout === 'inline' ? {flexShrink: 0} : {}), [layout])

    return (
      <Layout {...restProps} ref={ref} style={layoutStyles} data-from-to-layout>
        {from && (
          <>
            <Flex align={flexAlign[align]} style={columnStyles}>
              {from}
            </Flex>
            <Flex align="center" justify="center" padding={2}>
              <FromToArrow />
            </Flex>
          </>
        )}
        <Flex align={flexAlign[align]} style={columnStyles}>
          {to}
        </Flex>
      </Layout>
    )
  }
)

FromTo.displayName = 'FromTo'
