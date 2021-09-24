import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactElement,
  Children,
  cloneElement,
  Fragment,
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
  MenuDivider,
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

const RootBox = styled(Box)<{$hide?: boolean}>`
  border-radius: inherit;
  position: relative;
  overflow: hidden;
  /**
  * We need to add padding + negative margin to make the focusRing  visible
  */
  padding: ${({theme}) => theme.sanity.focusRing.width}px;
  margin: -${({theme}) => theme.sanity.focusRing.width}px;
`

const InnerFlex = styled(Flex)<{$hide?: boolean}>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  white-space: nowrap;
  pointer-events: ${({$hide}) => ($hide ? 'none' : 'inherit')};
  opacity: ${({$hide}) => ($hide ? 0 : 1)};
  position: ${({$hide}) => ($hide ? 'absolute' : 'static')};
  visibility: ${({$hide}) => ($hide ? 'hidden' : 'visible')};
  width: ${({$hide}) => ($hide ? 'max-content' : 'auto')};
  /**
  * We need to add padding + negative margin to make the focusRing  visible
  */
  padding: ${({theme}) => theme.sanity.focusRing.width}px;
  margin: -${({theme}) => theme.sanity.focusRing.width}px;
`

const OptionBox = styled(Box)<{$inView: boolean}>`
  list-style: none;
  display: flex;
  white-space: nowrap;
  visibility: ${({$inView}) => ($inView ? 'visible' : 'hidden')};
  pointer-events: ${({$inView}) => ($inView ? 'inherit' : 'none')};
`

export function CollapseMenu(props: CollapseMenuProps) {
  const {children, menuButton, gap = 1, onMenuVisible, menuPopoverProps} = props

  const [rootBoxElement, setRootBoxElement] = useState<HTMLDivElement | null>(null)
  const [innerFlexElement, setInnerFlexElement] = useState<HTMLDivElement | null>(null)
  const [collapsed, setCollapsed] = useState<boolean>(true)
  const [menuOptions, setMenuOptions] = useState<ReactElement[] | []>([])
  const rootBoxRect = useElementRect(rootBoxElement)

  /**
   * Array of children
   */
  const childrenArray = useMemo(() => Children.toArray(children) as ReactElement[], [children])

  /**
   * Filter to get the latest state of menu options
   */
  const menuOptionsArray = useMemo(
    () => childrenArray.filter(({key}) => menuOptions.find((o: ReactElement) => o.key === key)),
    [childrenArray, menuOptions]
  )

  /**
   * Menu popover props
   */
  const popoverProps: PopoverProps = useMemo(
    () => ({portal: true, placement: 'bottom', preventOverflow: true, ...menuPopoverProps}),
    [menuPopoverProps]
  )

  /**
   * Pick what button to render as menu button
   */
  const menuButtonToRender = useMemo(() => {
    if (menuButton) {
      return menuButton
    }
    return <Button mode="bleed" icon={EllipsisVerticalIcon} />
  }, [menuButton])

  /**
   * Check if menu is visible
   */
  const menuIsVisible = useMemo(() => collapsed && menuOptionsArray.length > 0, [
    collapsed,
    menuOptionsArray.length,
  ])

  useEffect(() => {
    if (onMenuVisible) {
      onMenuVisible(menuIsVisible)
    }
  }, [menuIsVisible, onMenuVisible])

  /**
   * Compare RootBox width with InnerFlex scrollWidth to collapse/expand menu
   */
  useEffect(() => {
    if (rootBoxRect && innerFlexElement) {
      const collapse = rootBoxRect.width < innerFlexElement.scrollWidth
      setCollapsed(collapse)
    }
  }, [innerFlexElement, rootBoxRect])

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
    (childKey) => {
      const exists = menuOptionsArray.some((o) => o.key === childKey)
      return exists
    },
    [menuOptionsArray]
  )

  return (
    <RootBox ref={setRootBoxElement} display="flex" data-ui="CollapseMenu" sizing="border">
      {/* Expanded row, visible when there is enough space to show text on buttons */}
      <InnerFlex align="center" ref={setInnerFlexElement} $hide={collapsed} aria-hidden={collapsed}>
        <Flex as="ul" gap={gap}>
          {childrenArray.map((child, index) => {
            const {
              buttonProps = {},
              dividerBefore,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              menuItemProps,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              tooltipProps,
              ...restProps
            } = child.props as CollapseMenuItemProps

            const showDivider = dividerBefore && index !== 0

            return (
              <Fragment key={child.key}>
                {showDivider && <CollapseMenuDivider />}
                <Tooltip
                  portal
                  disabled
                  {...tooltipProps}
                  content={
                    <Box padding={2} sizing="border">
                      <Text size={1} muted>
                        {tooltipProps?.text}
                      </Text>
                    </Box>
                  }
                >
                  <Box as="li">
                    {cloneElement(child, {
                      ...{...restProps, ...buttonProps},
                    })}
                  </Box>
                </Tooltip>
              </Fragment>
            )
          })}
        </Flex>
      </InnerFlex>

      {/* Collapsed row, visible when there is not enough space to show text on buttons */}
      <InnerFlex align="center" gap={gap} $hide={!collapsed} aria-hidden={!collapsed}>
        <Flex gap={gap} as="ul">
          {childrenArray.map((child, index) => {
            if (child.type !== CollapseMenuButton) {
              return null
            }

            const {
              buttonProps = {},
              dividerBefore,
              collapseText = true,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              menuItemProps,
              text,
              tooltipProps,
              ...restProps
            } = child.props as CollapseMenuItemProps

            const showDivider = index !== 0 && dividerBefore

            return (
              <InView
                aria-hidden={isInMenu(child.key)}
                // eslint-disable-next-line react/jsx-no-bind
                onChange={(inView) => handleInViewChange({inView, child})}
                key={child.key}
                threshold={1}
                rootMargin="0px 2px 0px 0px"
              >
                {({ref, inView}) => (
                  <OptionBox ref={ref} as="li" $inView={inView && collapsed}>
                    {showDivider && <CollapseMenuDivider />}
                    <Box marginLeft={showDivider ? gap : undefined}>
                      <Tooltip
                        disabled={!inView || !collapseText}
                        portal
                        {...tooltipProps}
                        content={
                          <Box padding={2} sizing="border">
                            <Text size={1} muted>
                              {tooltipProps?.text || text}
                            </Text>
                          </Box>
                        }
                      >
                        {cloneElement(child, {
                          ...{...restProps, ...buttonProps},
                          'aria-label': text,
                          text: collapseText ? null : text,
                        })}
                      </Tooltip>
                    </Box>
                  </OptionBox>
                )}
              </InView>
            )
          })}
        </Flex>
      </InnerFlex>

      {/* Menu displaying the options that is outside of RootBox in collapsed state  */}
      {menuIsVisible && (
        <MenuButton
          button={menuButtonToRender}
          id="collapse-menu"
          popover={popoverProps}
          menu={
            <Menu>
              {menuOptionsArray.map((child, index) => {
                const {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  buttonProps,
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  collapseText,
                  dividerBefore,
                  icon,
                  menuItemProps = {},
                  selected,
                  text,
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  tooltipProps,
                  ...restProps
                } = child.props as CollapseMenuItemProps

                return (
                  <Fragment key={child.key}>
                    {dividerBefore && index !== 0 && <MenuDivider />}
                    <MenuItem
                      {...restProps}
                      icon={icon}
                      text={text}
                      fontSize={2}
                      radius={2}
                      {...menuItemProps}
                      pressed={selected}
                    />
                  </Fragment>
                )
              })}
            </Menu>
          }
        />
      )}
    </RootBox>
  )
}
