import {Flex} from '@sanity/ui'
import {
  Children,
  cloneElement,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
  type RefAttributes,
} from 'react'
import {styled} from 'styled-components'

import {type MenuButtonProps} from '../../../ui-components/menuButton/MenuButton'
import {CollapseOverflowMenu} from '../collapseMenu/CollapseOverflowMenu'
import {ObserveElement} from '../collapseMenu/ObserveElement'
import {ContextMenuButton} from '../contextMenuButton/ContextMenuButton'

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

const MenuButtonPlaceholder = styled.div`
  display: flex;
  visibility: hidden;
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
  style?: CSSProperties
}

/**
 * Similar to `<CollapseMenu />` but instead of collapsing the inner items by removing the text
 * it shows the items that fit, and the rest are rendered in a menu.
 * @internal */
export function CollapseTabList(props: CollapseTabListProps & RefAttributes<HTMLDivElement>) {
  const {
    ref,
    children: childrenProp,
    gap,
    menuButtonProps,
    disableRestoreFocusOnClose,
    onMenuClose,
    collapsed,
    style,
    ...rest
  } = props
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null)
  // Whether the measured clone of each child key currently fits in the hidden row,
  // or undefined for keys not measured yet. Entries for keys that have left
  // `children` linger here, so everything rendered must be derived through the
  // current `children` array.
  const [intersections, setIntersections] = useState<Record<string, boolean | undefined>>({})

  const children = useMemo(
    () => Children.toArray(childrenProp).filter(_isReactElement),
    [childrenProp],
  )

  // Nothing is shown until the first measurement arrives, to avoid flashing
  // children that may not fit.
  const hasMeasured = Object.keys(intersections).length > 0

  /**
   * The children that do not fit and therefore belong in the overflow menu.
   * The single source for the menu button, its options and the inline children,
   * so the menu button can never render without menu items.
   */
  const hiddenChildren = useMemo(
    () => children.filter((child) => child.key !== null && intersections[child.key] === false),
    [children, intersections],
  )

  /**
   * Keeps track of the children that will be shown in place and not in the menu.
   */
  const displayChildren = useMemo(() => {
    if (collapsed) return null // If collapsed, we don't want to show any children
    if (!hasMeasured) return null // If we haven't run the intersection observer yet, we don't want to show any children
    return children.filter((child) => !hiddenChildren.includes(child))
  }, [children, collapsed, hasMeasured, hiddenChildren])

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
    () => (collapsed ? children : hiddenChildren),
    [children, hiddenChildren, collapsed],
  )

  const handleIntersection = useCallback(
    (entry: IntersectionObserverEntry, child: React.JSX.Element) => {
      const {key} = child
      if (key === null) return
      setIntersections((prev) =>
        prev[key] === entry.isIntersecting ? prev : {...prev, [key]: entry.isIntersecting},
      )
    },
    [],
  )

  return (
    <Flex
      direction="column"
      ref={ref}
      sizing="border"
      {...rest}
      style={{position: 'relative', minWidth: 0, ...style}}
    >
      <Flex justify="center" gap={gap} flex={1}>
        {displayChildren}
        {hiddenChildren.length > 0 || collapsed ? (
          <CollapseOverflowMenu
            disableRestoreFocusOnClose={disableRestoreFocusOnClose}
            menuButton={menuButton}
            menuButtonProps={menuButtonProps}
            menuOptions={menuOptionsArray}
            onMenuClose={onMenuClose}
          />
        ) : (
          // The hidden row below prepends a menu button clone before the child
          // clones, so children only measure as fitting when the container is at
          // least a menu button wider than the children themselves. Reserving
          // that footprint here keeps a content-sized container (the navbar's
          // wide-regime `auto` grid track) wide enough on its own, and makes the
          // swap with the real menu button layout-stable.
          <MenuButtonPlaceholder aria-hidden="true">
            {cloneElement(menuButton, {
              'disabled': true,
              'aria-hidden': true,
              'tabIndex': -1,
            })}
          </MenuButtonPlaceholder>
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
            // Entries are delivered oldest first, so the last one is current
            onIntersectionChange={(e) => handleIntersection(e[e.length - 1], child)}
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
}
