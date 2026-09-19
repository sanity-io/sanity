import {type ChildResolver} from '../ChildResolver'

/**
 * Brands the child resolver that `getDocumentTypeListItem` attaches with the type name it lists, so
 * a list item can recognize it as the canonical whole-type document list for that type. A well-known
 * symbol (`Symbol.for`) survives multiple installed copies of the package, where a module-local
 * symbol would leave the built-in child unrecognized and silently withhold its count.
 *
 * @internal
 */
const defaultDocumentTypeChildMarker: unique symbol = Symbol.for(
  'sanity.structureBuilder.defaultDocumentTypeChild',
)

type DefaultDocumentTypeChild = ChildResolver & {
  [defaultDocumentTypeChildMarker]: string
}

/** @internal */
export function markDefaultDocumentTypeChild(
  child: ChildResolver,
  typeName: string,
): ChildResolver {
  return Object.assign(child, {[defaultDocumentTypeChildMarker]: typeName})
}

/** @internal */
export function getDefaultDocumentTypeChildType(child: unknown): string | undefined {
  if (typeof child !== 'function') {
    return undefined
  }

  const brand = (child as Partial<DefaultDocumentTypeChild>)[defaultDocumentTypeChildMarker]
  return typeof brand === 'string' ? brand : undefined
}
