/* eslint-disable camelcase */

import {Box, Flex, rem, Stack, Text, Theme, useForwardedRef} from '@sanity/ui'
import React, {forwardRef, useCallback, useMemo} from 'react'
import styled, {css} from 'styled-components'
import {ChangeIndicator, ChangeIndicatorContextProvidedProps} from '../changeIndicators'
import {FieldPresence} from '../../presence'
import {useFormNode} from '../../form/components/formNode'
import {FormFieldValidationStatus} from './FormFieldValidationStatus'
import {FormFieldSetLegend} from './FormFieldSetLegend'
import {focusRingStyle} from './styles'

export interface FormFieldSetProps {
  /**
   * @beta
   */
  __unstable_changeIndicator?: ChangeIndicatorContextProvidedProps | boolean
  children: React.ReactNode | (() => React.ReactNode)
  level?: number
  onSetCollapsed: (collapsed: boolean) => void
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
   * NOTE: The dollar sign ($) prefix is a `styled-components` convention for
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

export const FormFieldSet = forwardRef(function FormFieldSet(
  props: FormFieldSetProps &
    Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref' | 'title'>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {collapsed, collapsible, level: contextLevel, presence, type, validation} = useFormNode()

  const {
    __unstable_changeIndicator: changeIndicator = false,
    children,
    level = contextLevel,
    onFocus,
    onSetCollapsed,
    tabIndex,
    ...restProps
  } = props

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
      <>
        {changeIndicator ? (
          <ChangeIndicator {...(changeIndicator === true ? {} : changeIndicator)}>
            {getChildren(children)}
          </ChangeIndicator>
        ) : (
          getChildren(children)
        )}
      </>
    )
  }, [changeIndicator, children, collapsed])

  return (
    <Root data-level={level} {...restProps}>
      {type.title && (
        <Flex align="flex-end">
          <Box flex={1} paddingY={2}>
            <Stack space={2}>
              <Flex>
                <FormFieldSetLegend
                  collapsed={Boolean(collapsed)}
                  collapsible={collapsible}
                  onClick={collapsible ? handleToggle : undefined}
                  title={type.title}
                />

                {hasValidationMarkers && (
                  <Box marginLeft={2}>
                    <FormFieldValidationStatus fontSize={1} />
                  </Box>
                )}
              </Flex>

              {type.description && (
                <Text muted size={1}>
                  {type.description}
                </Text>
              )}
            </Stack>
          </Box>

          {presence.length > 0 && (
            <Box>
              <FieldPresence maxAvatars={4} />
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
