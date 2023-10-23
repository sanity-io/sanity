import {EllipsisVerticalIcon} from '@sanity/icons'
import {Button, Flex, MenuButtonProps, Text, useElementRect} from '@sanity/ui'
import React, {cloneElement, forwardRef, useCallback, useMemo, useState} from 'react'
import styled, {css} from 'styled-components'
import {Tooltip} from '../../../ui'
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
    height: 0px;
    visibility: hidden;
  }
`

const OptionObserveElement = styled(ObserveElement)`
  ${OPTION_STYLE}
`

const OptionHiddenFlex = styled(Flex)`
  ${OPTION_STYLE}
`

function _isReactElement(node: unknown): node is React.ReactElement {
  return Boolean(node)
}

/** @internal */
export const CollapseMenu = forwardRef(function CollapseMenu(
  props: CollapseMenuProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    children: childrenProp,
    collapsed,
    collapseText = true,
    disableRestoreFocusOnClose,
    gap,
    menuButtonProps,
    onMenuClose,
    ...rest
  } = props
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null)
  const [hiddenRowEl, setHiddenRowEl] = useState<HTMLDivElement | null>(null)
  const rootRect = useElementRect(rootEl)
  const [menuOptions, setMenuOptions] = useState<React.ReactElement[]>([])

  const hasOverflow = useMemo(() => {
    if (rootRect && rootEl && hiddenRowEl) {
      return rootRect.width < hiddenRowEl.scrollWidth
    }
    return false
  }, [hiddenRowEl, rootEl, rootRect])

  const menuButton = useMemo(
    () => menuButtonProps?.button || <Button icon={EllipsisVerticalIcon} mode="bleed" />,
    [menuButtonProps],
  )

  const intersectionOptions = useMemo(
    () => ({
      root: rootEl,
      threshold: 1,
      rootMargin: '2px',
    }),
    [rootEl],
  )

  const children = useMemo(
    () => React.Children.toArray(childrenProp).filter(_isReactElement),
    [childrenProp],
  )

  const menuOptionsArray = useMemo(
    // eslint-disable-next-line max-nested-callbacks
    () => children.filter(({key}) => menuOptions.find((o: React.ReactElement) => o.key === key)),
    [children, menuOptions],
  )

  const menuIsVisible = useMemo(
    () => collapsed || menuOptionsArray.length > 0,
    [collapsed, menuOptionsArray.length],
  )

  const isInMenu = useCallback(
    (childKey: any) => menuOptionsArray.some((o) => o.key === childKey),
    [menuOptionsArray],
  )

  const handleIntersection = useCallback(
    (e: IntersectionObserverEntry, child: React.ReactElement) => {
      const exists = isInMenu(child.key)

      if (!e.isIntersecting && !exists) {
        setMenuOptions((prev) => [child, ...prev])
      }

      if (e.isIntersecting && exists) {
        const updatedOptions = menuOptionsArray.filter(({key}) => key !== child.key)

        setMenuOptions(updatedOptions)
      }
    },
    [isInMenu, menuOptionsArray],
  )

  const items = useMemo(
    () =>
      children.map((child) => {
        const {collapsedProps, expandedProps} = child.props
        const modeProps = hasOverflow ? collapsedProps : expandedProps
        const text = hasOverflow && collapseText ? undefined : child.props.text

        return cloneElement(child, {
          ...modeProps,
          text: text,
        })
      }),
    [children, collapseText, hasOverflow],
  )

  if (collapsed) {
    return (
      <CollapseOverflowMenu
        disableRestoreFocusOnClose={disableRestoreFocusOnClose}
        menuButton={menuButton}
        menuButtonProps={menuButtonProps}
        menuOptionsArray={children}
        onMenuClose={onMenuClose}
      />
    )
  }

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
        {/* Content */}
        <RowFlex gap={gap}>
          {items.map((child, index) => {
            const {dividerBefore, tooltipText = '', tooltipProps = {}} = child.props
            const hidden = isInMenu(child.key)

            return (
              <React.Fragment key={child.key}>
                {dividerBefore && index !== 0 && <CollapseMenuDivider hidden={hidden} />}

                <OptionObserveElement
                  options={intersectionOptions}
                  // eslint-disable-next-line react/jsx-no-bind
                  callback={(e) => handleIntersection(e[0], child)}
                  aria-hidden={hidden}
                  data-hidden={hidden}
                >
                  <Tooltip portal disabled={!tooltipText} content={tooltipText} {...tooltipProps}>
                    <Flex>
                      {cloneElement(child, {
                        disabled: child.props.disabled || hidden,
                        'aria-hidden': hidden,
                      })}
                    </Flex>
                  </Tooltip>
                </OptionObserveElement>
              </React.Fragment>
            )
          })}
        </RowFlex>

        {/* Hidden row used to detect when to collapse/collapse the layout  */}
        <RowFlex data-hidden aria-hidden="true" gap={gap} ref={setHiddenRowEl}>
          {children.map((child, index) => {
            const {dividerBefore} = child.props

            return (
              <React.Fragment key={child.key}>
                {dividerBefore && index !== 0 && <CollapseMenuDivider />}
                <OptionHiddenFlex key={child.key}>
                  {cloneElement(child, {
                    disabled: true,
                    'aria-hidden': true,
                  })}
                </OptionHiddenFlex>
              </React.Fragment>
            )
          })}
        </RowFlex>
      </RootFlex>

      {menuIsVisible && (
        <Flex marginLeft={gap}>
          <CollapseOverflowMenu
            disableRestoreFocusOnClose={disableRestoreFocusOnClose}
            menuButton={menuButton}
            menuButtonProps={menuButtonProps}
            menuOptionsArray={menuOptionsArray}
            onMenuClose={onMenuClose}
          />
        </Flex>
      )}
    </OuterFlex>
  )
})
