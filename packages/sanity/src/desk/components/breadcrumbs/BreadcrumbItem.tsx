import {Text, Tooltip, Box, type ButtonProps} from '@sanity/ui'
import React, {forwardRef, type HTMLProps, type ReactNode, type ForwardedRef} from 'react'
import styled, {css} from 'styled-components'

type ParentTextProps = ButtonProps & Omit<HTMLProps<HTMLButtonElement>, 'ref' | 'as'>

/**
 * @internal
 * @hidden
 */
export interface BreadcrumbItemProps extends ParentTextProps {
  children: ReactNode
}

function buttonBaseStyles() {
  return css`
    /** style copied from @sanity/ui */
    -webkit-font-smoothing: inherit;
    appearance: none;
    display: inline-flex;
    align-items: center;
    font: inherit;
    border: 0;
    outline: none;
    user-select: none;
    text-decoration: none;
    border: 0;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    white-space: nowrap;
    text-align: left;
    position: relative;

    & > span {
      display: block;
      flex: 1;
      min-width: 0;
      border-radius: inherit;
    }

    &::-moz-focus-inner {
      border: 0;
      padding: 0;
    }

    /** custom style **/
    width: 100%;
  `
}

const Root = styled.button(buttonBaseStyles)

function Button(): JSX.Element {
  return <Root>Hello</Root>
}

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
    <Button
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
