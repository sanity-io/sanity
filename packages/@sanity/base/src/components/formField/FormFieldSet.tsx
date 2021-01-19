/* eslint-disable camelcase */

import {Path, Marker} from '@sanity/types'
import {Box, Card, Flex, Grid, Stack, Text, useForwardedRef} from '@sanity/ui'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import React, {forwardRef, useState, useCallback, useEffect} from 'react'
import styled from 'styled-components'
import {ChangeIndicator, ChangeIndicatorContextProvidedProps} from '../../change-indicators'
import {FieldPresence, FormFieldPresence} from '../../presence'
import {FormFieldValidationStatus} from './FormFieldValidationStatus'
import {FormFieldSetLegend} from './FormFieldSetLegend'
import {markersToValidationList} from './helpers'

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

const Content = styled(Card)`
  outline: none;

  &:focus {
    /* @todo: prettify */
    box-shadow: 0 0 0 2px #06f;
  }

  &:focus:not(:focus-visible) {
    box-shadow: none;
  }
`

export const FormFieldSet = forwardRef(
  (
    props: FormFieldSetProps &
      Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'height' | 'onFocus' | 'ref'>,
    ref
  ) => {
    const {
      __unstable_changeIndicator: changeIndicator,
      __unstable_markers: markers = [],
      __unstable_presence: presence = [],
      children,
      collapsed: collapsedProp = false,
      collapsible,
      columns,
      description,
      level = 0,
      onFocus,
      tabIndex,
      title,
      ...restProps
    } = props
    const [collapsed, setCollapsed] = useState(collapsedProp)
    const validation = markersToValidationList(markers)
    const hasValidations = validation.length > 0
    const forwardedRef = useForwardedRef(ref)
    const fieldSetPresence = collapsible && collapsed ? presence : []

    const handleFocus = useCallback(
      (event: React.FocusEvent<HTMLDivElement>) => {
        const element = forwardedRef.current

        if (element === event.target) {
          if (onFocus) onFocus(FOCUS_PATH)
        }
      },
      [forwardedRef, onFocus]
    )

    const handleToggleCollapse = useCallback(() => setCollapsed((v) => !v), [])

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

          {fieldSetPresence.length > 0 && (
            <Box>
              <FieldPresence maxAvatars={4} presence={fieldSetPresence} />
            </Box>
          )}
        </Flex>

        <Content
          borderLeft={level > 0}
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
