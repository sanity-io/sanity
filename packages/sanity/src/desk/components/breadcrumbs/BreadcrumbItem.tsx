import {Text, Tooltip, Box, Button, type ButtonProps} from '@sanity/ui'
import React, {forwardRef, type HTMLProps, type ReactNode, type ForwardedRef} from 'react'
import styled from 'styled-components'

type ParentTextProps = ButtonProps & Omit<HTMLProps<HTMLButtonElement>, 'ref' | 'as'>

/**
 * @internal
 * @hidden
 */
export interface BreadcrumbItemProps extends ParentTextProps {
  children: ReactNode
}

const StyledButton = styled(Button)`
  width: 100%;
`

/**
 * @internal
 * @hidden
 */
export const BreadcrumbItem = forwardRef(function BreadcrumbItem(
  props: BreadcrumbItemProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {children, ...restProps} = props

  return (
    <StyledButton
      ref={ref}
      mode="bleed"
      padding={1}
      textAlign="left"
      justify="flex-start"
      {...restProps}
      text={
        <Tooltip
          content={
            <Box padding={2} style={{maxWidth: '500px'}}>
              <Text muted size={1}>
                {children}
              </Text>
            </Box>
          }
          padding={1}
          placement="bottom"
          fallbackPlacements={['top', 'left', 'right']}
          portal
        >
          <span>{children}</span>
        </Tooltip>
      }
    />
  )
})
