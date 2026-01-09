import {type StackablePerspective} from '@sanity/client'
import {
  type Path,
  type ReferenceFilterSearchOptions,
  type ReferenceOptions,
  type SanityDocument,
} from '@sanity/types'
import {get} from '@sanity/util/paths'

import {type Source} from '../../../../config'

export async function resolveUserDefinedFilter(ctx: {
  options: ReferenceOptions | undefined
  document: SanityDocument
  valuePath: Path
  getClient: Source['getClient']
  perspective: StackablePerspective[]
}): Promise<ReferenceFilterSearchOptions> {
  const {options, document, valuePath, perspective, getClient} = ctx
  if (!options) {
    return {}
  }

  if (typeof options.filter === 'function') {
    const parentPath = valuePath.slice(0, -1)
    const parent = get(document, parentPath) as Record<string, unknown>
    const resolvedFilter = await options.filter({
      document,
      parentPath,
      parent,
      perspective,
      getClient,
    })
    return resolvedFilter
  }

  return {
    filter: options.filter,
    params: 'filterParams' in options ? options.filterParams : undefined,
  }
}
