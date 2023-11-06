import {EllipsisHorizontalIcon} from '@sanity/icons'
import {Flex, MenuButtonProps} from '@sanity/ui'
import React, {
  Children,
  cloneElement,
  ForwardedRef,
  forwardRef,
  Fragment,
  memo,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import styled, {css} from 'styled-components'
import {difference} from 'lodash'
import {Button, Tooltip} from '../../../ui'
import {CollapseOverflowMenu} from './CollapseOverflowMenu'
import {ObserveElement} from './ObserveElement'
import {CollapseMenuDivider} from './CollapseMenuDivider'

/** @internal */
export interface CollapseMenuProps {
  children: ReactNode | ReactNode[]
  collapsed?: boolean
  collapseText?: boolean
  disableRestoreFocusOnClose?: boolean
  gap?: number | number[]
  menuButtonProps?: Omit<MenuButtonProps, 'id' | 'menu' | 'button'> & {
    id?: string
    button?: ReactElement
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

function _isReactElement(node: unknown): node is ReactElement {
  return Boolean(node)
}

interface IntersectionEntry {
  intersects: boolean
  element: ReactElement
  // todo: potentially add bounding rects so we can calculate how many we can fit non-collapsed vs collapsed
}

type ElementIntersections = Record<string, IntersectionEntry>

/** @internal */
export const CollapseMenu = forwardRef(function CollapseMenu(
  props: CollapseMenuProps,
  ref: ForwardedRef<any>,
) {
  const {children, collapsed, disableRestoreFocusOnClose, onMenuClose, menuButtonProps, ...rest} =
    props

  const menuOptions = useMemo(() => Children.toArray(children).filter(_isReactElement), [children])
  const menuButton = useMemo(
    () => menuButtonProps?.button || <Button icon={EllipsisHorizontalIcon} mode="bleed" />,
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
  ref: ForwardedRef<HTMLDivElement>,
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
  const [expandedIntersections, setExpandedIntersections] = useState<ElementIntersections>({})

  // We use this to keep track of intersections for collapsed options
  const [collapsedIntersections, setCollapsedIntersections] = useState<ElementIntersections>({})

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
    (e: IntersectionObserverEntry, element: ReactElement) => {
      setExpandedIntersections((current) => {
        const key = element.key
        if (key === null) {
          throw new Error('Expected element to have a non-null key')
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
    (e: IntersectionObserverEntry, element: ReactElement) => {
      setCollapsedIntersections((current) => {
        const key = element.key
        if (key === null) {
          throw new Error('Expected child element to have a non-null key')
        }
        const currentElementIntersection = current[key]

        const nextElementIntersection = {
          intersects: e.isIntersecting,
          element,
        }
        return currentElementIntersection?.intersects === nextElementIntersection.intersects
          ? current
          : {
              ...current,
              [key]: nextElementIntersection,
            }
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
                <Fragment key={optionElement.key}>
                  {dividerBefore && index !== 0 && <CollapseMenuDivider hidden={hidden} />}
                  <Tooltip portal disabled={!tooltipText} content={tooltipText} {...tooltipProps}>
                    <Flex>
                      {cloneElement(optionElement, {
                        disabled: optionElement.props.disabled || hidden,
                        'aria-hidden': hidden,
                      })}
                    </Flex>
                  </Tooltip>
                </Fragment>
              )
            })}
        </RowFlex>
        {/* Rendered hidden in order to calculate intersections for original (expanded) menu options */}
        <RenderHidden
          gap={gap}
          elements={menuOptions}
          intersectionOptions={intersectionOptions}
          onIntersectionChange={handleExpandedIntersection}
        />
        {/* Rendered hidden in order to calculate intersections for collapsed menu options */}
        <RenderHidden
          gap={gap}
          elements={collapsedElements}
          intersectionOptions={intersectionOptions}
          onIntersectionChange={handleCollapsedIntersection}
        />
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

const RenderHidden = memo(function RenderHidden(props: {
  elements: ReactElement[]
  gap?: number | number[]
  intersectionOptions: IntersectionObserverInit
  onIntersectionChange: (e: IntersectionObserverEntry, element: ReactElement) => void
}) {
  const {elements, gap, intersectionOptions, onIntersectionChange} = props
  return (
    <RowFlex data-hidden aria-hidden="true" gap={gap} overflow="hidden">
      {elements.map((element, index) => {
        const {dividerBefore} = element.props
        return (
          <Fragment key={element.key}>
            {dividerBefore && index !== 0 && <CollapseMenuDivider hidden />}

            <OptionObserveElement
              options={intersectionOptions}
              // eslint-disable-next-line react/jsx-no-bind
              onIntersectionChange={(e) => onIntersectionChange(e[0], element)}
            >
              <Flex>
                {cloneElement(element, {
                  disabled: true,
                  'aria-hidden': true,
                })}
              </Flex>
            </OptionObserveElement>
          </Fragment>
        )
      })}
    </RowFlex>
  )
})
