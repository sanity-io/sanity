import {type ArraySchemaType} from '@sanity/types'
import {type ArrayOfObjectsItemMember} from 'sanity/_singleton'

import {type ArrayItemError} from './memberErrors'
import {type PrimitiveFormNode} from './nodes'

/**
 * @hidden
 * @beta */
export type ArrayOfObjectsMember = ArrayOfObjectsItemMember | ArrayItemError

/**
 * @hidden
 * @beta */
export type ArrayOfPrimitivesMember = ArrayOfPrimitivesItemMember | ArrayItemError

/**
 * @hidden
 * @beta */
export interface ArrayOfPrimitivesItemMember<Node extends PrimitiveFormNode = PrimitiveFormNode> {
  kind: 'item'
  // note: there's no persistent handle on primitive items, so our only option is to use the index as key here
  key: string
  index: number
  // the state resolver should make sure this
  // gets collapsible: false and collapsed by default

  open: boolean

  parentSchemaType: ArraySchemaType

  /**
   * @hidden
   * @beta */
  item: Node
}
