import {SetBuilder, type SetSynchronization} from '@sanity/descriptors'
import {type Schema} from '@sanity/types'

import {convertTypeDef, type Options} from './convert'
import {type RegistryType} from './types'

const CACHE = new WeakMap<Schema, SetSynchronization<RegistryType>>()

export class DescriptorConverter {
  opts: Options
  cache: WeakMap<Schema, SetSynchronization<RegistryType>> = new WeakMap()

  constructor(opts: Options) {
    this.opts = opts
  }

  /**
   * Returns a synchronization object for a schema.
   *
   * This is automatically cached in a weak map.
   */
  get(schema: Schema): SetSynchronization<RegistryType> {
    let value = CACHE.get(schema)
    if (value) return value

    const builder = new SetBuilder()
    for (const name of schema.getLocalTypeNames()) {
      const typeDef = convertTypeDef(schema.get(name)!, this.opts)
      builder.addObject('sanity.schema.namedType', {name, typeDef})
    }

    if (schema.parent) {
      builder.addSet(this.get(schema.parent))
    }

    value = builder.build('sanity.schema.registry')
    CACHE.set(schema, value)
    return value
  }
}
