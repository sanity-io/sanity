import {FormFieldPresence} from '@sanity/base/presence'
import {ChangeIndicator, ChangeIndicatorContextProvidedProps} from '@sanity/base/components'
import {Path, Marker} from '@sanity/types'
import {Box, Card, Flex, Grid, Stack, Text, useForwardedRef} from '@sanity/ui'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import React, {forwardRef, useState, useCallback, useEffect} from 'react'
import {ToggleArrowRightIcon} from '@sanity/icons'
import styled from 'styled-components'
import {FormFieldValidationStatus} from './FormFieldValidationStatus'
import {markersToValidationList} from './helpers'

interface FormFieldSetProps {
  changeIndicator?: ChangeIndicatorContextProvidedProps | boolean
  children: React.ReactNode
  collapsed?: boolean
  collapsible?: boolean
  columns?: number
  description?: React.ReactNode
  level?: number
  markers?: Marker[]
  onFocus?: (path: Path) => void
  // @todo: Turn `presence` into a React.ReactNode property?
  // presence?: React.ReactNode
  presence?: FormFieldPresence[]
  title?: React.ReactNode
  // @todo: Take list of validation items instead of raw markers?
  // validation?: FormFieldValidation[]
}

const FOCUS_PATH = [FOCUS_TERMINATOR]

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
      changeIndicator,
      children,
      collapsed: collapsedProp = false,
      collapsible,
      columns,
      description,
      level,
      markers = [],
      onFocus,
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

    const handleToggleCollapse = useCallback(() => setCollapsed((v) => !v), [])

    let content = (
      <Grid columns={columns} gapX={4} gapY={5}>
        {children}
      </Grid>
    )

    if (changeIndicator) {
      content = <ChangeIndicator {...changeIndicator}>{children}</ChangeIndicator>
    }

    useEffect(() => {
      setCollapsed(collapsedProp)
    }, [collapsedProp])

    return (
      <Box
        // @todo
        // as="fieldset"
        data-level={level}
        {...restProps}
      >
        <Box paddingY={2}>
          <Stack space={2}>
            <Flex>
              <FormFieldSetTitle
                collapsed={collapsed}
                collapsible={collapsible}
                onClick={collapsible ? handleToggleCollapse : undefined}
                title={title}
              />

              {hasValidations && (
                <Box marginLeft={2}>
                  <FormFieldValidationStatus fontSize={1} markers={markers} />
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
      </Box>
    )
  }
)

FormFieldSet.displayName = 'FormFieldSet'

const FormFieldSetTitleButton = styled(Flex).attrs({forwardedAs: 'button'})`
  appearance: none;
  border: 0;
  background: none;
  color: inherit;
  -webkit-font-smoothing: inherit;
  font: inherit;
  outline: none;

  &:not([hidden]) {
    display: flex;
  }

  &:focus {
    /* @todo: prettify */
    box-shadow: 0 0 0 2px #06f;
  }

  &:focus:not(:focus-visible) {
    box-shadow: none;
  }
`

const FormFieldSetTitleToggleIconBox = styled(Box)`
  width: 9px;
  height: 9px;
  margin-right: 3px;

  & svg {
    transition: transform 100ms;
  }
`

function FormFieldSetTitle(props: {
  collapsed: boolean
  collapsible: boolean
  onClick: () => void
  title: React.ReactNode
}) {
  const {collapsed, collapsible, onClick, title} = props

  const text = (
    <Text
      // @todo
      // as="legend"
      weight="semibold"
      size={1}
    >
      {title || <em>Untitled</em>}
    </Text>
  )

  if (!collapsible) {
    return text
  }

  return (
    <FormFieldSetTitleButton onClick={onClick}>
      <FormFieldSetTitleToggleIconBox>
        <Text muted size={1}>
          <ToggleArrowRightIcon
            style={{
              transform: `rotate(${collapsed ? '0' : '90deg'}) translate3d(0, 0, 0)`,
            }}
          />
        </Text>
      </FormFieldSetTitleToggleIconBox>
      {text}
    </FormFieldSetTitleButton>
  )
}
