import {Text, Tooltip, type ButtonProps} from '@sanity/ui'
import React, {forwardRef, type HTMLProps, type ReactNode, type ForwardedRef, useRef} from 'react'
import {BreadcrumbButtonRoot, BreadcrumbItemSpan, TooltipRoot} from './breadcrumbs.styles'

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
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {children, isTitle, ...restProps} = props
  const textRef = useRef<HTMLSpanElement | null>(null)
  const {clientWidth = 0, scrollWidth = 0} = textRef.current ?? {}

  return (
    <BreadcrumbButtonRoot
      isTitle={isTitle}
      ref={ref}
      mode="bleed"
      padding={1}
      textAlign="left"
      justify="flex-start"
      {...restProps}
    >
      <Tooltip
        content={
          <TooltipRoot padding={2}>
            <Text size={1}>{children}</Text>
          </TooltipRoot>
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
