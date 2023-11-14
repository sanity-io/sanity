import {EllipsisVerticalIcon} from '@sanity/icons'
import {Box, Button, Flex, MenuButtonProps, Text, Tooltip} from '@sanity/ui'
import React, {cloneElement, forwardRef, ReactElement, useCallback, useMemo, useState} from 'react'
import styled, {css} from 'styled-components'
import {difference} from 'lodash'
import {CollapseOverflowMenu} from './CollapseOverflowMenu'
import {ObserveElement} from './ObserveElement'
import {CollapseMenuDivider} from './CollapseMenuDivider'

/** @internal */
export interface CollapseMenuProps {
  children: React.ReactNode
  collapsed?: boolean
  collapseText?: boolean
  disableRestoreFocusOnClose?: boolean
  gap?: number | number[]
  menuButtonProps?: Omit<MenuButtonProps, 'id' | 'menu' | 'button'> & {
    id?: string
    button?: React.ReactElement
  }
  onMenuClose?: () => void
}

const FOCUS_RING_PADDING = 3

const OPTION_STYLE = css`
  list-style: none;
  display: flex;
  white-space: nowrap;

  &[data-hidden='true'] {
    opacity: 0;
    visibility: hidden;
  }
`

const OuterFlex = styled(Flex)`
  padding: ${FOCUS_RING_PADDING}px;
  margin: -${FOCUS_RING_PADDING}px;
  box-sizing: border-box;
`

const RootFlex = styled(Flex)`
  border-radius: inherit;
  position: relative;
`

const RowFlex = styled(Flex)`
  width: max-content;
  &[data-hidden='true'] {
    visibility: hidden;
    position: relative;
    margin-top: -1px;
    height: 1px;
  }
`

const OptionObserveElement = styled(ObserveElement)`
  ${OPTION_STYLE}
`

function _isReactElement(node: unknown): node is React.ReactElement {
  return Boolean(node)
}

interface IntersectionEntry {
  intersects: boolean
  element: ReactElement
  // todo: add bounding rects so we can calculate how many we can fit non-collapsed vs collapsed
}

type ChildIntersectionState = Record<string, IntersectionEntry>

/** @internal */
export const CollapseMenu = forwardRef(function CollapseMenu(
  props: CollapseMenuProps,
  ref: React.ForwardedRef<any>,
) {
  const {
    children: childrenProp,
    collapsed,
    disableRestoreFocusOnClose,
    onMenuClose,
    menuButtonProps,
    ...rest
  } = props

  const menuOptions = useMemo(
    () => React.Children.toArray(childrenProp).filter(_isReactElement),
    [childrenProp],
  )
  const menuButton = useMemo(
    () => menuButtonProps?.button || <Button icon={EllipsisVerticalIcon} mode="bleed" />,
    [menuButtonProps],
  )

  if (collapsed) {
    // We're showing everything collapsed (e.g. not auto-collapsing), so just delegate straight to the Menu
    return (
      <CollapseOverflowMenu
        ref={ref}
        disableRestoreFocusOnClose={disableRestoreFocusOnClose}
        menuButton={menuButton}
        menuButtonProps={menuButtonProps}
        menuOptions={menuOptions}
        onMenuClose={onMenuClose}
      />
    )
  }
  return (
    <AutoCollapseMenu
      {...rest}
      ref={ref}
      disableRestoreFocusOnClose={disableRestoreFocusOnClose}
      menuButtonProps={menuButtonProps}
      menuOptions={menuOptions}
      onMenuClose={onMenuClose}
    />
  )
})

/** @internal */
export const AutoCollapseMenu = forwardRef(function AutoCollapseMenu(
  props: Omit<CollapseMenuProps, 'children' | 'collapsed'> & {menuOptions: ReactElement[]},
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    collapseText = true,
    disableRestoreFocusOnClose,
    gap,
    menuOptions,
    menuButtonProps,
    onMenuClose,
    ...rest
  } = props

  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null)

  // We use this to keep track of intersections for expanded options
  const [expandedIntersections, setExpandedIntersections] = useState<ChildIntersectionState>({})

  // We use this to keep track of intersections for collapsed options
  const [collapsedIntersections, setCollapsedIntersections] = useState<ChildIntersectionState>({})

  const intersectionOptions = useMemo(
    () => ({
      root: rootEl,
      // safari needs threshold to be < 1
      threshold: 0.99,
      rootMargin: '2px',
    }),
    [rootEl],
  )

  // Make a list of all element keys of menu options
  const menuOptionKeys = useMemo(() => menuOptions.map((child) => child.key), [menuOptions])

  // List of intersections we have not yet received
  const pendingIntersections = useMemo(
    () => [
      ...difference(menuOptionKeys, Object.keys(expandedIntersections)),
      ...difference(menuOptionKeys, Object.keys(collapsedIntersections)),
    ],
    [menuOptionKeys, expandedIntersections, collapsedIntersections],
  )

  // Get a list of the expanded elements that are currently overflowing
  const overflowingExpandedElements = useMemo(
    () =>
      menuOptions.filter((optionElement) => {
        const entry = expandedIntersections[optionElement.key as string]
        return entry && !entry.intersects
      }),
    [expandedIntersections, menuOptions],
  )

  const handleExpandedIntersection = useCallback(
    (e: IntersectionObserverEntry, element: React.ReactElement) => {
      setExpandedIntersections((current) => {
        const key = element.key
        if (key === null) {
          throw new Error('Expected child element to have a non-null key')
        }
        const nextState = {
          intersects: e.isIntersecting,
          element: element,
        }

        const currentState = current[key]
        if (!currentState || currentState.intersects !== nextState.intersects) {
          return {
            ...current,
            [key]: nextState,
          }
        }
        return current
      })
    },
    [],
  )

  const handleCollapsedIntersection = useCallback(
    (e: IntersectionObserverEntry, element: React.ReactElement) => {
      setCollapsedIntersections((current) => {
        const key = element.key
        if (key === null) {
          throw new Error('Expected child element to have a non-null key')
        }
        const nextChildState = {
          intersects: e.isIntersecting,
          element: element,
        }

        const currentChildState = current[key]
        if (!currentChildState || currentChildState.intersects !== nextChildState.intersects) {
          return {
            ...current,
            [key]: nextChildState,
          }
        }
        return current
      })
    },
    [],
  )

  // An array of children rendered in their collapsed state
  const collapsedElements = useMemo(
    () =>
      menuOptions.map((optionElement) => {
        const {collapsedProps} = optionElement.props
        const modeProps = collapsedProps
        const text = collapseText ? undefined : optionElement.props.text

        return cloneElement(optionElement, {
          ...modeProps,
          text: text,
        })
      }),
    [menuOptions, collapseText],
  )

  // Even if rendered collapsed, there might not be space to render all,
  // so put the overflowing ones into the menu
  const overflowingCollapsedOptionElements = useMemo(
    () =>
      menuOptions.filter((optionElement) => {
        const intersection = collapsedIntersections[optionElement.key as string]
        return intersection?.intersects === false
      }),
    [menuOptions, collapsedIntersections],
  )

  const shouldCollapse = overflowingExpandedElements.length > 0
  const visibleMenuOptions = shouldCollapse
    ? collapsedElements.filter((optionElement) => {
        const intersection = collapsedIntersections[optionElement.key as string]
        return intersection?.intersects === true
      })
    : menuOptions

  const menuButton = useMemo(
    () => menuButtonProps?.button || <Button icon={EllipsisVerticalIcon} mode="bleed" />,
    [menuButtonProps],
  )

  return (
    <OuterFlex
      align="center"
      data-ui="CollapseMenu"
      overflow="hidden"
      sizing="border"
      ref={ref}
      {...rest}
    >
      <RootFlex direction="column" flex={1} justify="center" ref={setRootEl}>
        {/* The actual visible options */}
        <RowFlex gap={gap}>
          {pendingIntersections.length === 0 &&
            visibleMenuOptions.map((optionElement, index) => {
              const {dividerBefore, tooltipText = '', tooltipProps = {}} = optionElement.props
              const hidden =
                !optionElement.key ||
                !(optionElement.key in expandedIntersections) ||
                overflowingCollapsedOptionElements.includes(optionElement)
              return (
                <React.Fragment key={optionElement.key}>
                  {dividerBefore && index !== 0 && <CollapseMenuDivider hidden={hidden} />}
                  <Tooltip
                    portal
                    disabled={!tooltipText}
                    content={
                      <Box padding={2} sizing="border">
                        <Text size={1}>{tooltipText}</Text>
                      </Box>
                    }
                    {...tooltipProps}
                  >
                    <Flex>
                      {cloneElement(optionElement, {
                        disabled: optionElement.props.disabled || hidden,
                        'aria-hidden': hidden,
                      })}
                    </Flex>
                  </Tooltip>
                </React.Fragment>
              )
            })}
        </RowFlex>
        {/* Rendered hidden in order to calculate intersections for expanded menu options */}
        <RowFlex data-hidden aria-hidden="true" gap={gap} overflow="hidden">
          {menuOptions.map((child, index) => {
            const {dividerBefore} = child.props
            return (
              <React.Fragment key={child.key}>
                {dividerBefore && index !== 0 && <CollapseMenuDivider hidden />}

                <OptionObserveElement
                  options={intersectionOptions}
                  // eslint-disable-next-line react/jsx-no-bind
                  onIntersectionChange={(e) => handleExpandedIntersection(e[0], child)}
                >
                  <Flex>
                    {cloneElement(child, {
                      disabled: true,
                      'aria-hidden': true,
                    })}
                  </Flex>
                </OptionObserveElement>
              </React.Fragment>
            )
          })}
        </RowFlex>
        {/* Rendered hidden in order to calculate intersections for collapsed menu options */}
        <RowFlex data-hidden aria-hidden="true" gap={gap} overflow="hidden">
          {collapsedElements.map((child, index) => {
            const {dividerBefore} = child.props
            return (
              <React.Fragment key={child.key}>
                {dividerBefore && index !== 0 && <CollapseMenuDivider hidden />}

                <OptionObserveElement
                  options={intersectionOptions}
                  // eslint-disable-next-line react/jsx-no-bind
                  onIntersectionChange={(e) => handleCollapsedIntersection(e[0], child)}
                >
                  <Flex>
                    {cloneElement(child, {
                      disabled: true,
                      'aria-hidden': true,
                    })}
                  </Flex>
                </OptionObserveElement>
              </React.Fragment>
            )
          })}
        </RowFlex>
      </RootFlex>

      {/* Show the collapsed items that doesn't fit in a menu */}
      {overflowingCollapsedOptionElements.length > 0 && (
        <Flex marginLeft={gap}>
          <CollapseOverflowMenu
            disableRestoreFocusOnClose={disableRestoreFocusOnClose}
            menuButton={menuButton}
            menuButtonProps={menuButtonProps}
            menuOptions={overflowingCollapsedOptionElements}
            onMenuClose={onMenuClose}
          />
        </Flex>
      )}
    </OuterFlex>
  )
})
