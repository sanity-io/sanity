import {type ComponentType, type ReactNode, Suspense, type SVGProps} from 'react'
import {isValidElementType} from 'react-is'

/**
 * Takes the place of an icon while it loads, at the size of a `@sanity/icons` icon. Receives the
 * props the icon would, so a wrapper that sizes or styles the icon (`ui5`'s `Icon`) styles it too.
 */
function IconPlaceholder(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      data-sanity-icon-placeholder=""
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    />
  )
}

/**
 * A boundary around a single icon, so an icon that suspends (a `React.lazy` component, such as
 * those in the `icons` map of `@sanity/icons`) shows a placeholder in its own place instead of
 * suspending the component that renders it. Without it, the suspension reaches the closest
 * boundary above, which hides that whole subtree and detaches its refs: components that render
 * their content only once a ref has stored an element (the collapse menus' measuring rows, the
 * Portable Text editor's portal) then drop the icon, the boundary reveals them, and they render it
 * again, until React throws "Maximum update depth exceeded".
 *
 * @internal
 */
export function IconSuspense(props: {children: ReactNode}) {
  return <Suspense fallback={<IconPlaceholder />}>{props.children}</Suspense>
}

const suspenseIcons = new WeakMap<object, ComponentType<SVGProps<SVGSVGElement>>>()

/**
 * Returns a component that renders `icon` inside its own boundary (see `IconSuspense`), for props
 * that take an icon component, such as `icon` on buttons and menu items. The wrapper is created
 * once per icon, so passing the result on every render keeps the icon mounted. Anything that is
 * not a component (an element, a string, nothing) is returned as is: an element can be cloned by
 * the component that renders it, which a boundary around it would break.
 *
 * @internal
 */
export function withIconSuspense<T>(icon: T): T {
  if (
    (typeof icon !== 'function' && (typeof icon !== 'object' || icon === null)) ||
    !isValidElementType(icon)
  ) {
    return icon
  }

  const cached = suspenseIcons.get(icon)
  if (cached) return cached as T

  const Icon = icon as ComponentType<SVGProps<SVGSVGElement>>
  function SuspenseIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <Suspense fallback={<IconPlaceholder {...props} />}>
        <Icon {...props} />
      </Suspense>
    )
  }
  suspenseIcons.set(icon, SuspenseIcon)
  return SuspenseIcon as T
}
