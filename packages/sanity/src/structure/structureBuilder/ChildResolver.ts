import {CollectionBuilder, Collection, SerializeOptions} from './StructureNodes'
import {StructureContext} from './types'
import {Observable} from 'rxjs'

/**
 * Interface for child resolver options
 *
 * @public
 */
// TODO: unify with the RouterSplitPaneContext
export interface ChildResolverOptions {
  /** Child parent */
  parent: unknown
  /** Child index */
  index: number
  splitIndex: number
  /** Child path */
  path: string[]
  /** Child parameters */
  params: Record<string, string | undefined>
  /** Structure context. See {@link StructureContext} */
  structureContext: StructureContext
  /** Serialize options. See {@link SerializeOptions} */
  serializeOptions?: SerializeOptions
}

/**
 * Item Child. See {@link CollectionBuilder} and {@link Collection}
 *
 * @public
 */
export type ItemChild = CollectionBuilder | Collection | undefined

/**
 * Interface for child observable
 *
 * @public
 */
export interface ChildObservable {
  /** Subscribes to the child observable. See {@link ItemChild} */
  subscribe: (child: ItemChild | Promise<ItemChild>) => Record<string, unknown>
}

/**
 * Interface for child resolver
 *
 * @public */
// TODO: unify with PaneNodeResolver in desk-tool
export interface ChildResolver {
  (
    itemId: string,
    options: ChildResolverOptions,
  ): ItemChild | Promise<ItemChild> | ChildObservable | Observable<ItemChild> | undefined
}
