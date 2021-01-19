/* eslint-disable camelcase */

import {Path, Marker} from '@sanity/types'
import {Box, Flex, Grid, rem, Stack, Text, Theme, useForwardedRef} from '@sanity/ui'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import React, {forwardRef, useState, useCallback, useEffect} from 'react'
import styled, {css} from 'styled-components'
import {ChangeIndicator, ChangeIndicatorContextProvidedProps} from '../../change-indicators'
import {FieldPresence, FormFieldPresence} from '../../presence'
import {FormFieldValidationStatus} from './FormFieldValidationStatus'
import {FormFieldSetLegend} from './FormFieldSetLegend'
import {markersToValidationList} from './helpers'
import {focusRingStyle} from './styles'

export interface FormFieldSetProps {
  /**
   * @beta
   */
  __unstable_changeIndicator?: ChangeIndicatorContextProvidedProps | boolean
  /**
   * @beta
   */
  __unstable_markers?: Marker[]
  /**
   * @beta
   */
  __unstable_presence?: FormFieldPresence[]
  children: React.ReactNode
  collapsed?: boolean
  collapsible?: boolean
  columns?: number
  description?: React.ReactNode
  /**
   * The nesting level of the form field set
   */
  level?: number
  onFocus?: (path: Path) => void
  onToggle?: (collapsed: boolean) => void
  title?: React.ReactNode
}

const FOCUS_PATH = [FOCUS_TERMINATOR]

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
      box-shadow: ${focusRingStyle({base, focusRing})};
    }

    &:focus:not(:focus-visible) {
      box-shadow: none;
    }
  `
})

export const FormFieldSet = forwardRef(
  (
    props: FormFieldSetProps &
      Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'onFocus' | 'ref'>,
    ref
  ) => {
    const {
      __unstable_changeIndicator: changeIndicator = false,
      __unstable_markers: markers = [],
      __unstable_presence: presence = [],
      children,
      collapsed: collapsedProp = false,
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
    const [collapsed, setCollapsed] = useState(collapsedProp)
    const validation = markersToValidationList(markers)
    const hasValidations = validation.length > 0
    const forwardedRef = useForwardedRef(ref)

    const handleFocus = useCallback(
      (event: React.FocusEvent<HTMLDivElement>) => {
        const element = forwardedRef.current

        if (element === event.target) {
          if (onFocus) onFocus(FOCUS_PATH)
        }
      },
      [forwardedRef, onFocus]
    )

    const handleToggleCollapse = useCallback(() => {
      setCollapsed(!collapsed)
      if (onToggle) onToggle(!collapsed)
    }, [collapsed, onToggle])

    let content = (
      <Grid columns={columns} gapX={4} gapY={5}>
        {children}
      </Grid>
    )

    if (changeIndicator) {
      const changeIndicatorProps = typeof changeIndicator === 'object' ? changeIndicator : {}

      content = <ChangeIndicator {...changeIndicatorProps}>{children}</ChangeIndicator>
    }

    useEffect(() => {
      setCollapsed(collapsedProp)
    }, [collapsedProp])

    return (
      <Root data-level={level} {...restProps}>
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

                {hasValidations && (
                  <Box marginLeft={2}>
                    <FormFieldValidationStatus fontSize={1} __unstable_markers={markers} />
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

        <Content
          $borderLeft={level > 0}
          hidden={collapsed}
          marginTop={1}
          paddingLeft={level === 0 ? 0 : 3}
          onFocus={handleFocus}
          ref={forwardedRef}
          tabIndex={tabIndex}
        >
          {!collapsed && content}
        </Content>
      </Root>
    )
  }
)

FormFieldSet.displayName = 'FormFieldSet'
