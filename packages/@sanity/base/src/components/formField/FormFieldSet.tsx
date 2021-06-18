/* eslint-disable camelcase */
import {Box, Flex, Grid, rem, Stack, Text, Theme, useForwardedRef} from '@sanity/ui'
import React, {forwardRef, ReactNode, useCallback} from 'react'
import styled, {css} from 'styled-components'
import {FormFieldSetLegend} from './FormFieldSetLegend'
import {focusRingStyle} from './styles'

export interface FormFieldSetProps {
  validation?: ReactNode
  presence?: ReactNode
  children: ReactNode | (() => ReactNode)
  collapsed?: boolean
  collapsible?: boolean
  columns?: number
  description?: ReactNode
  /**
   * The nesting level of the form field set
   */
  level?: number
  onToggle?: (collapsed: boolean) => void
  title?: ReactNode
}

function getChildren(children: ReactNode | (() => ReactNode)): ReactNode {
  return typeof children === 'function' ? children() : children
}

const Root = styled(Box).attrs({forwardedAs: 'fieldset'})`
  border: none;

  /* See: https://thatemil.com/blog/2015/01/03/reset-your-fieldset/ */
  body:not(:-moz-handler-blocked) & {
    display: table-cell;
  }
`

const Content = styled(Box)<{
  /**
   * @note: The dollar sign ($) prefix is a `styled-components` convention for
   * denoting transient props. See:
   * https://styled-components.com/docs/api#transient-props
   */
  $borderLeft: boolean
  theme: Theme
}>((props) => {
  const {$borderLeft, theme} = props
  const {focusRing, radius} = theme.sanity
  const {base} = theme.sanity.color

  return css`
    outline: none;
    border-left: ${$borderLeft ? '1px solid var(--card-border-color)' : undefined};
    border-radius: ${rem(radius[1])};

    &:focus {
      box-shadow: ${focusRingStyle({base, focusRing: {...focusRing, offset: 2}})};
    }

    &:focus:not(:focus-visible) {
      box-shadow: none;
    }
  `
})

export const FormFieldSet = forwardRef(
  (
    props: FormFieldSetProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>,
    ref
  ) => {
    const {
      validation,
      presence,
      children,
      collapsed = false,
      collapsible,
      columns,
      description,
      level = 0,
      onFocus,
      onToggle,
      tabIndex,
      title,
      ...restProps
    } = props

    const forwardedRef = useForwardedRef(ref)

    const handleToggleCollapse = useCallback(() => {
      if (onToggle) onToggle(!collapsed)
    }, [collapsed, onToggle])

    const handleFocus = useCallback(
      (event: React.FocusEvent<HTMLDivElement>) => {
        const element = forwardedRef.current

        if (element === event.target) {
          if (onFocus) onFocus(event)
        }
      },
      [forwardedRef, onFocus]
    )

    return (
      <Root data-level={level} {...restProps}>
        {title && (
          <Flex align="flex-end">
            <Box flex={1} paddingY={2}>
              <Stack space={2}>
                <Flex>
                  <FormFieldSetLegend
                    collapsed={collapsed}
                    collapsible={collapsible}
                    onClick={collapsible ? handleToggleCollapse : undefined}
                    title={title}
                  />

                  {validation && <Box marginLeft={2}>{validation}</Box>}
                </Flex>

                {description && (
                  <Text muted size={1}>
                    {description}
                  </Text>
                )}
              </Stack>
            </Box>

            {presence && <Box>{presence}</Box>}
          </Flex>
        )}

        <Content
          $borderLeft={level > 0}
          hidden={collapsed}
          marginTop={1}
          paddingLeft={level === 0 ? 0 : 3}
          onFocus={typeof tabIndex === 'number' && tabIndex > -1 ? handleFocus : undefined}
          ref={forwardedRef}
          tabIndex={tabIndex}
        >
          {!collapsed && (
            <Grid columns={columns} gapX={4} gapY={5}>
              {getChildren(children)}
            </Grid>
          )}
        </Content>
      </Root>
    )
  }
)

FormFieldSet.displayName = 'FormFieldSet'
