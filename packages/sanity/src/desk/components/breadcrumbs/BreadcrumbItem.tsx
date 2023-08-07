import {Text, Tooltip, Box, type ButtonProps} from '@sanity/ui'
import React, {forwardRef, type HTMLProps, type ReactNode, type ForwardedRef, useRef} from 'react'
import {BreadcrumbButtonRoot, BreadcrumbItemSpan} from './breadcrumbs.styles'

type ParentTextProps = ButtonProps & Omit<HTMLProps<HTMLButtonElement>, 'ref' | 'as'>

/**
 * @internal
 * @hidden
 */
export interface BreadcrumbItemProps extends ParentTextProps {
  children: ReactNode
  isTitle?: boolean
}

/**
 * @internal
 * @hidden
 */
export const BreadcrumbItem = forwardRef(function BreadcrumbItem(
  props: BreadcrumbItemProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const {children, isTitle, ...restProps} = props
  const textRef = useRef<HTMLSpanElement | null>(null)
  const {clientWidth = 0, scrollWidth = 0} = textRef.current ?? {}

  return (
    <BreadcrumbButtonRoot
      isTitle={isTitle}
      ref={ref}
      mode="bleed"
      padding={2}
      textAlign="left"
      justify="flex-start"
      {...restProps}
    >
      <Tooltip
        content={
          <Box padding={2} style={{maxWidth: '500px'}}>
            <Text size={1}>{children}</Text>
          </Box>
        }
        padding={1}
        placement="bottom"
        fallbackPlacements={['top', 'left', 'right']}
        portal
        // We only want to show tooltip if the text is overflowing
        disabled={clientWidth >= scrollWidth}
      >
        <BreadcrumbItemSpan ref={textRef}>{children}</BreadcrumbItemSpan>
      </Tooltip>
    </BreadcrumbButtonRoot>
  )
})
