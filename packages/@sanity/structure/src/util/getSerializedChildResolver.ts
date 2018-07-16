import {ChildResolver, ChildResolverOptions, ItemChild} from '../ChildResolver'
import {Collection} from '../StructureNodes'
import {ListBuilder} from '../List'

export function getSerializedChildResolver(resolver: ChildResolver): ChildResolver {
  return (
    itemId: string,
    parent: Collection,
    options: ChildResolverOptions
  ): ItemChild | Promise<ItemChild> | undefined =>
    Promise.resolve(resolver(itemId, parent, options)).then(res => {
      const resolved = res as ListBuilder
      if (!resolved) {
        return resolved
      }

      if (typeof resolved.serialize === 'function') {
        return resolved.serialize()
      }

      return resolved
    })
}
