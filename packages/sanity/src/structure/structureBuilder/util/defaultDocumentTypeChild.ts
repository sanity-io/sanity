import {type ChildResolver} from '../ChildResolver'

/**
 * Brands the child resolver that `getDocumentTypeListItem` attaches, so a list item can recognize
 * it as the canonical whole-type document list. A well-known symbol (`Symbol.for`) survives multiple
 * installed copies of the package, where a module-local symbol would leave the built-in child
 * unrecognized and silently withhold its count.
 *
 * @internal
 */
const defaultDocumentTypeChildMarker: unique symbol = Symbol.for(
  'sanity.structureBuilder.defaultDocumentTypeChild',
)

type DefaultDocumentTypeChild = ChildResolver & {
  [defaultDocumentTypeChildMarker]: true
}

/** @internal */
export function markDefaultDocumentTypeChild(child: ChildResolver): ChildResolver {
  return Object.assign(child, {[defaultDocumentTypeChildMarker]: true as const})
}

/** @internal */
export function isDefaultDocumentTypeChild(child: unknown): child is DefaultDocumentTypeChild {
  return (
    typeof child === 'function' &&
    (child as Partial<DefaultDocumentTypeChild>)[defaultDocumentTypeChildMarker] === true
  )
}
