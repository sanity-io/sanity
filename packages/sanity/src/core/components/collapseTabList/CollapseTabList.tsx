import {Flex} from '@sanity/ui'
import {
  Children,
  cloneElement,
  type ForwardedRef,
  forwardRef,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {styled} from 'styled-components'

import {type MenuButtonProps} from '../../../ui-components'
import {CollapseOverflowMenu} from '../collapseMenu/CollapseOverflowMenu'
import {ObserveElement} from '../collapseMenu/ObserveElement'
import {ContextMenuButton} from '../contextMenuButton'

function _isReactElement(node: unknown): node is React.JSX.Element {
  return Boolean(node)
}

const OptionObserveElement = styled(ObserveElement)`
  list-style: none;
  white-space: nowrap;
  flex-shrink: 0;
  opacity: 0;
  visibility: hidden;
`

const HiddenRow = styled(Flex)`
  opacity: 0;
  height: 0.1px;
  overflow: hidden;
`

interface CollapseTabListProps {
  children: ReactNode
  gap?: number | number[]
  menuButtonProps?: Omit<MenuButtonProps, 'id' | 'menu' | 'button'> & {
    id?: string
    button?: React.JSX.Element
  }
  onMenuClose?: () => void
  collapsed?: boolean
  disableRestoreFocusOnClose?: boolean
}

/**
 * Similar to `<CollapseMenu />` but instead of collapsing the inner items by removing the text
 * it shows the items that fit, and the rest are rendered in a menu.
 * @internal */
export const CollapseTabList = forwardRef(function CollapseTabList(
  props: CollapseTabListProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    children: childrenProp,
    gap,
    menuButtonProps,
    disableRestoreFocusOnClose,
    onMenuClose,
    collapsed,
    ...rest
  } = props
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null)
  const [hiddenElements, setHiddenElements] = useState<React.JSX.Element[]>([])
  const [showChildren, setShowChildren] = useState(false)

  const children = useMemo(
    () => Children.toArray(childrenProp).filter(_isReactElement),
    [childrenProp],
  )

  /**
   * Keeps track of the children that will be shown in place and not in the menu.
   */
  const displayChildren = useMemo(() => {
    if (collapsed) return null // If collapsed, we don't want to show any children
    if (!showChildren) return null // If we haven't run the intersection observer yet, we don't want to show any children
    // eslint-disable-next-line max-nested-callbacks
    return children.filter((c) => !hiddenElements.some((h) => h.key === c.key))
  }, [children, collapsed, hiddenElements, showChildren])

  const intersectionOptions = useMemo(
    () => ({
      root: rootEl,
      threshold: 1,
      rootMargin: '1px',
    }),
    [rootEl],
  )

  const menuButton = useMemo(
    () => menuButtonProps?.button || <ContextMenuButton />,
    [menuButtonProps],
  )

  const menuOptionsArray = useMemo(
    () =>
      collapsed
        ? children
        : children.filter(({key}) =>
            // eslint-disable-next-line max-nested-callbacks
            hiddenElements.find((o: React.JSX.Element) => o.key === key),
          ),
    [children, hiddenElements, collapsed],
  )

  const handleIntersection = useCallback(
    (e: IntersectionObserverEntry, child: React.JSX.Element) => {
      const isHidden = hiddenElements.some((el) => el.key === child.key)

      if (!showChildren) setShowChildren(true)
      const isIntersecting = e.isIntersecting
      if (!isHidden && !isIntersecting) setHiddenElements((prev) => [...prev, child])
      if (isHidden && isIntersecting)
        // eslint-disable-next-line max-nested-callbacks
        setHiddenElements((prev) => prev.filter((el) => el.key !== child.key))
    },
    [hiddenElements, showChildren, setShowChildren, setHiddenElements],
  )

  return (
    <Flex direction="column" ref={ref} sizing="border" style={{position: 'relative'}} {...rest}>
      <Flex justify="center" gap={gap} flex={1}>
        {displayChildren}
        {(hiddenElements.length > 0 || collapsed) && (
          <CollapseOverflowMenu
            disableRestoreFocusOnClose={disableRestoreFocusOnClose}
            menuButton={menuButton}
            menuButtonProps={menuButtonProps}
            menuOptions={menuOptionsArray}
            onMenuClose={onMenuClose}
          />
        )}
      </Flex>

      {/* Element that always render all the children to keep track of their position and if the available space to render them */}
      <HiddenRow justify="flex-start" gap={gap} ref={setRootEl} data-hidden aria-hidden="true">
        {cloneElement(menuButton, {
          'disabled': true,
          'aria-hidden': true,
        })}
        {children?.map((child) => (
          <OptionObserveElement
            key={`${child.key}_observer`}
            options={intersectionOptions}
            // eslint-disable-next-line react/jsx-no-bind
            onIntersectionChange={(e) => handleIntersection(e[0], child)}
          >
            {cloneElement(child, {
              'disabled': true,
              'aria-hidden': true,
              'tabIndex': -1,
            })}
          </OptionObserveElement>
        ))}
      </HiddenRow>
    </Flex>
  )
})
