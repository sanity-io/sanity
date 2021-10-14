import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactElement,
  Children,
  cloneElement,
} from 'react'
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Text,
  Tooltip,
  useElementRect,
  PopoverProps,
} from '@sanity/ui'
import {InView} from 'react-intersection-observer'
import {EllipsisVerticalIcon} from '@sanity/icons'
import styled from 'styled-components'
import {CollapseMenuDivider, CollapseMenuButton, CollapseMenuItemProps} from '.'

interface CollapseMenuProps {
  children: React.ReactNode
  gap?: number | number[]
  menuButton?: ReactElement<HTMLButtonElement>
  menuPopoverProps?: PopoverProps
  onMenuVisible?: (visible: boolean) => void
}

const Root = styled(Box)<{$hide?: boolean}>`
  border-radius: inherit;
  overflow: hidden;
  position: relative;
  white-space: nowrap;
  width: 100%;
  padding: 0.25rem;
  margin: -0.25rem;
`

const Inner = styled(Flex)<{$hide?: boolean}>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: ${({$hide}) => ($hide ? 'none' : 'inherit')};
  opacity: ${({$hide}) => ($hide ? 0 : 1)};
  position: ${({$hide}) => ($hide ? 'absolute' : 'static')};
  visibility: ${({$hide}) => ($hide ? 'hidden' : 'visible')};
  width: ${({$hide}) => ($hide ? 'max-content' : 'auto')};
`

const OptionBox = styled(Box)<{$inView: boolean}>`
  display: flex;
  flex-shrink: 0;
  list-style: none;
  white-space: nowrap;
  visibility: ${({$inView}) => ($inView ? 'visible' : 'hidden')};
  pointer-events: ${({$inView}) => ($inView ? 'inherit' : 'none')};
`

export function CollapseMenu(props: CollapseMenuProps) {
  const {children, menuButton, gap = 1, onMenuVisible, menuPopoverProps} = props
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null)
  const [expandedRef, setExpandedRef] = useState<HTMLDivElement | null>(null)
  const [collapsedInnerRef, setCollapsedInnerRef] = useState<HTMLDivElement | null>(null)
  const [collapsed, setCollapsed] = useState<boolean>(true)
  const [menuOptions, setMenuOptions] = useState<ReactElement[] | []>([])
  const rootRect = useElementRect(rootRef)
  const childrenArray = useMemo(() => Children.toArray(children) as ReactElement[], [children])

  //Filter to get the latest state of menu options
  const menuOptionsArray = useMemo(
    () => childrenArray.filter(({key}) => menuOptions.find((o: ReactElement) => o.key === key)),
    [childrenArray, menuOptions]
  )

  // Pick what button to render as menu button
  const menuButtonToRender = useMemo(() => {
    if (menuButton) {
      return menuButton
    }
    return <Button mode="bleed" icon={EllipsisVerticalIcon} />
  }, [menuButton])

  const menuIsVisible = collapsed && menuOptionsArray.length > 0

  useEffect(() => {
    if (onMenuVisible) {
      onMenuVisible(menuIsVisible)
    }
  }, [menuIsVisible, onMenuVisible])

  // Add or remove option in menuOptions
  const handleInViewChange = useCallback(
    (payload: {child: ReactElement; inView: boolean}) => {
      const {child, inView} = payload
      const exists = menuOptions.some(({key}) => key === child.key)

      if (!inView && !exists) {
        setMenuOptions((prev) => [child, ...prev])
      }

      if (inView && exists) {
        const updatedOptions = menuOptions.filter(({key}) => key !== child.key)
        setMenuOptions(updatedOptions)
      }
    },
    [menuOptions]
  )

  //Check if child is in menu
  const isInMenu = useCallback(
    (option) => {
      const exists = menuOptions.some(({key}) => key === option.key)
      return exists
    },
    [menuOptions]
  )

  //Check if menu should collapse
  useEffect(() => {
    if (rootRect && expandedRef) {
      const collapse = rootRect.width < expandedRef.scrollWidth
      setCollapsed(collapse)
    }
  }, [expandedRef, rootRect])

  return (
    <Root ref={setRootRef} display="flex" data-ui="CollapseMenu" sizing="border">
      {/* Expanded row */}
      <Inner ref={setExpandedRef} $hide={collapsed} aria-hidden={collapsed}>
        <Flex as="ul" gap={gap}>
          {childrenArray.map((child) => {
            const {
              buttonProps = {},
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              menuItemProps,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              tooltipProps,
              ...restProps
            } = child.props as CollapseMenuItemProps

            return (
              <Box as="li" key={child.key}>
                {cloneElement(
                  child,
                  {
                    ...{...restProps, ...buttonProps},
                  },
                  null
                )}
              </Box>
            )
          })}
        </Flex>
      </Inner>

      {/* Collapsed row */}
      <Inner gap={gap} $hide={!collapsed} aria-hidden={!collapsed}>
        <Flex ref={setCollapsedInnerRef} gap={gap} as="ul">
          {childrenArray.map((child) => {
            if (child.type === CollapseMenuDivider) {
              return child
            }

            if (child.type !== CollapseMenuButton) {
              return child
            }

            const {
              text,
              buttonProps = {},
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              menuItemProps,
              tooltipProps,
              ...restProps
            } = child.props as CollapseMenuItemProps

            return (
              <InView
                // eslint-disable-next-line react/jsx-no-bind
                onChange={(inView) => handleInViewChange({inView, child: child})}
                root={collapsedInnerRef}
                key={child.key}
                threshold={1}
                rootMargin="0px 2px 0px 0px"
                aria-hidden={isInMenu(child.key)}
              >
                {({ref, inView}) => (
                  <OptionBox ref={ref} as="li" $inView={inView && collapsed}>
                    <Tooltip
                      {...tooltipProps}
                      portal
                      disabled={!inView}
                      content={
                        <Box padding={2} sizing="border">
                          <Text size={1}>{text}</Text>
                        </Box>
                      }
                    >
                      <Box>
                        {cloneElement(
                          child,
                          {
                            ...{...restProps, ...buttonProps},
                            text: null,
                            'aria-label': text,
                          },
                          null
                        )}
                      </Box>
                    </Tooltip>
                  </OptionBox>
                )}
              </InView>
            )
          })}
        </Flex>
      </Inner>

      {/* Menu */}
      {menuIsVisible && (
        <MenuButton
          button={menuButtonToRender}
          id="collapse-menu"
          menu={
            <Menu>
              {menuOptionsArray.map((child) => {
                const {
                  icon,
                  selected,
                  text,
                  menuItemProps = {},
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  buttonProps,
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  tooltipProps,
                  ...restProps
                } = child.props as CollapseMenuItemProps

                return (
                  <MenuItem
                    {...restProps}
                    {...menuItemProps}
                    icon={icon}
                    key={child.key}
                    text={text}
                    fontSize={2}
                    radius={2}
                    pressed={selected}
                  />
                )
              })}
            </Menu>
          }
          popover={{portal: true, placement: 'bottom', preventOverflow: true, ...menuPopoverProps}}
        />
      )}
    </Root>
  )
}
