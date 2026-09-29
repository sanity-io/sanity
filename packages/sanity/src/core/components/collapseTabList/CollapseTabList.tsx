import {
  Children,
  cloneElement,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useState,
  type RefAttributes,
  createContext,
  ViewTransition,
  startTransition,
  useDeferredValue,
  Activity,
} from 'react'
import {Flex, type GapProps} from 'ui5'

import {type MenuButtonProps} from '../../../ui-components/menuButton/MenuButton'
import {CollapseOverflowMenu} from '../collapseMenu/CollapseOverflowMenu'
import {ObserveElement} from '../collapseMenu/ObserveElement'
import {ContextMenuButton} from '../contextMenuButton/ContextMenuButton'
import {hiddenRow, menuButtonPlaceholder, optionObserveElement} from './CollapseTabList.css'

function _isReactElement(node: unknown): node is React.JSX.Element {
  return Boolean(node)
}

interface CollapseTabListProps {
  children: ReactNode
  gap?: GapProps['gap']
  menuButtonProps?: Omit<MenuButtonProps, 'id' | 'menu' | 'button'> & {
    id?: string
    button?: React.JSX.Element
  }
  style?: CSSProperties
}

export const CollapseTabListVisibilityContext = createContext<boolean>(false)

/**
 * Similar to `<CollapseMenu />` but instead of collapsing the inner items by removing the text
 * it shows the items that fit, and the rest are rendered in a menu.
 * @internal */
export function CollapseTabList(props: CollapseTabListProps & RefAttributes<HTMLDivElement>) {
  const {ref, children: childrenProp, gap, menuButtonProps, style, ...rest} = props
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

  // Nothing is shown until a measurement arrives for the current children, to
  // avoid flashing children that may not fit. Derived from the current children
  // rather than the map as a whole, which retains entries for departed keys.
  const hasMeasured = children.some(
    (child) => child.key !== null && intersections[child.key] !== undefined,
  )

  /**
   * Partition of the current children: those measured as not fitting belong in
   * the overflow menu, the rest render inline. `hiddenChildren` is the single
   * source for the menu button and its options, so the menu button can never
   * render without menu items.
   */
  const {displayChildren, hiddenChildren} = useMemo(() => {
    const display: React.JSX.Element[] = []
    const hidden: React.JSX.Element[] = []
    for (const child of children) {
      if (child.key !== null && intersections[child.key] === false) {
        hidden.push(child)
      } else {
        display.push(child)
      }
    }
    return {displayChildren: display, hiddenChildren: hidden}
  }, [children, intersections])

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
  const viewTransitionName = useId()

  return (
    <Flex
      flexDirection="column"
      ref={ref}
      {...rest}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      <Flex justifyContent="center" gap={gap} flexBasis="0%" flexGrow={1}>
        {hasMeasured
          ? children.map((child, index) => {
              const collapsed = child.key !== null && intersections[child.key] === false
              return (
                <Activity key={child.key} mode={collapsed ? 'hidden' : 'visible'}>
                  {cloneElement(child, {
                    // `Activity` only hides with `display: none`, so a collapsed child stays in
                    // the accessibility tree and in the roving focus set unless it is marked here.
                    'aria-hidden': collapsed ? true : undefined,
                    'style': {
                      ...child.props.style,
                      // Suffixed with the index rather than `child.key`, which is not a valid
                      // CSS identifier.
                      viewTransitionName: `${viewTransitionName}${index}`,
                    },
                    'tabIndex': collapsed ? -1 : undefined,
                  })}
                </Activity>
              )
            })
          : null}
        <ViewTransition key="collapse-overflow-menu">
          {hiddenChildren.length > 0 ? (
            <CollapseOverflowMenu
              menuButton={menuButton}
              menuButtonProps={menuButtonProps}
              menuOptions={hiddenChildren}
            />
          ) : (
            // The hidden row below prepends a menu button clone before the child
            // clones, so children only measure as fitting when the container is at
            // least a menu button wider than the children themselves. Reserving
            // that footprint here keeps a content-sized container (the navbar's
            // wide-regime `auto` grid track) wide enough on its own, and makes the
            // swap with the real menu button layout-stable.
            <div
              className={menuButtonPlaceholder}
              aria-hidden="true"
              data-testid="collapse-tab-list-placeholder"
            >
              {cloneElement(menuButton, {
                'disabled': true,
                'aria-hidden': true,
                'tabIndex': -1,
              })}
            </div>
          )}
        </ViewTransition>
      </Flex>

      {/* Element that always render all the children to keep track of their position and if the available space to render them */}
      <Flex
        className={hiddenRow}
        justifyContent="flex-start"
        gap={gap}
        ref={setRootEl}
        data-hidden
        aria-hidden="true"
      >
        {cloneElement(menuButton, {
          'disabled': true,
          'aria-hidden': true,
        })}
        {children?.map((child) => (
          <ObserveElement
            className={optionObserveElement}
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
          </ObserveElement>
        ))}
      </Flex>
    </Flex>
  )
}
