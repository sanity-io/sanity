/* eslint-disable camelcase */

import {ValidationMarker} from '@sanity/types'
import {Box, Flex, Grid, rem, Stack, Text, Theme, useForwardedRef} from '@sanity/ui'
import React, {forwardRef, useState, useCallback, useEffect, useMemo} from 'react'
import styled, {css} from 'styled-components'
import {ChangeIndicator, ChangeIndicatorContextProvidedProps} from '../changeIndicators'
import {FieldPresence, FormFieldPresence} from '../../presence'
import {FormFieldValidationStatus} from './FormFieldValidationStatus'
import {FormFieldSetLegend} from './FormFieldSetLegend'
import {focusRingStyle} from './styles'

export interface FormFieldSetProps {
  /**
   * @alpha
   */
  __unstable_changeIndicator?: ChangeIndicatorContextProvidedProps | boolean
  /**
   * @alpha
   */
  __unstable_presence?: FormFieldPresence[]
  children: React.ReactNode | (() => React.ReactNode)
  collapsed?: boolean
  collapsible?: boolean
  columns?: number
  description?: React.ReactNode
  /**
   * The nesting level of the form field set
   */
  level?: number
  onSetCollapsed?: (collapsed: boolean) => void
  title?: React.ReactNode
  /**
   * @alpha
   */
  validation?: ValidationMarker[]
}

function getChildren(children: React.ReactNode | (() => React.ReactNode)): React.ReactNode {
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

const EMPTY_ARRAY: never[] = []

export const FormFieldSet = forwardRef(function FormFieldSet(
  props: FormFieldSetProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    __unstable_changeIndicator: changeIndicator = false,
    validation = EMPTY_ARRAY,
    __unstable_presence: presence = EMPTY_ARRAY,
    children,
    collapsible,
    columns,
    description,
    level = 0,
    onFocus,
    onSetCollapsed,
    collapsed,
    tabIndex,
    title,
    ...restProps
  } = props
  // const collapsed = false
  const hasValidationMarkers = validation.length > 0
  const forwardedRef = useForwardedRef(ref)

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const element = forwardedRef.current

      if (element === event.target) {
        if (onFocus) onFocus(event)
      }
    },
    [forwardedRef, onFocus]
  )

  const handleToggle = useCallback(() => {
    return onSetCollapsed?.(!collapsed)
  }, [collapsed, onSetCollapsed])

  const content = useMemo(() => {
    if (collapsed) {
      return null
    }
    return (
      <Grid columns={columns} gapX={4} gapY={5}>
        {changeIndicator ? (
          <ChangeIndicator {...(changeIndicator === true ? {} : changeIndicator)}>
            {getChildren(children)}
          </ChangeIndicator>
        ) : (
          getChildren(children)
        )}
      </Grid>
    )
  }, [changeIndicator, children, collapsed, columns])

  return (
    <Root data-level={level} {...restProps}>
      {title && (
        <Flex align="flex-end">
          <Box flex={1} paddingY={2}>
            <Stack space={2}>
              <Flex>
                <FormFieldSetLegend
                  collapsed={Boolean(collapsed)}
                  collapsible={collapsible}
                  onClick={collapsible ? handleToggle : undefined}
                  title={title}
                />

                {hasValidationMarkers && (
                  <Box marginLeft={2}>
                    <FormFieldValidationStatus fontSize={1} validation={validation} />
                  </Box>
                )}
              </Flex>

              {description && (
                <Text muted size={1}>
                  {description}
                </Text>
              )}
            </Stack>
          </Box>

          {presence.length > 0 && (
            <Box>
              <FieldPresence maxAvatars={4} presence={presence} />
            </Box>
          )}
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
        {!collapsed && content}
      </Content>
    </Root>
  )
})
