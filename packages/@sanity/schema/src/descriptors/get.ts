import { SetBuilder, SetSynchronization } from "@sanity/descriptors";
import { Schema } from "@sanity/types";
import { RegistryType } from "./types";
import { convertTypeDef } from "./convert";

const CACHE = new WeakMap<Schema, SetSynchronization<RegistryType>>()

/**
 * Returns a synchronization object for a schema.
 * 
 * This is automatically cached in a weak map.
 */
export function getDescriptorSynchronization(schema: Schema): SetSynchronization<RegistryType> {
  let value = CACHE.get(schema)
  if (value) return value

  const builder = new SetBuilder()
  for (const name of schema.getLocalTypeNames()) {
    const typeDef = convertTypeDef(schema.get(name)!)
    builder.addObject('sanity.schema.namedType', {name, typeDef})
  }

  if (schema.parent) {
    builder.addSet(getDescriptorSynchronization(schema.parent))
  }

  value = builder.build('sanity.schema.registry')
  CACHE.set(schema, value)
  return value
}
