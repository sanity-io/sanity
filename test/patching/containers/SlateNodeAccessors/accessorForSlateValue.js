import Immutable from 'immutable'

import {ImmutableAccessor} from '@sanity/mutator'

import BlockAccessor from './BlockAccessor'
import ListAccessor from './ListAccessor'

const SLATE_BLOCK_KINDS = ['paragraph', 'header', 'line', 'list', 'inline']

export default function accessorForSlateValue(value) {
  const kind = value.get('kind')
  if (SLATE_BLOCK_KINDS.includes(kind)) {
    return new BlockAccessor(value)
  }
  if (Immutable.List.isList(value)) {
    return new ListAccessor(value)
  }
  // TODO: text, range, mark
  return new ImmutableAccessor(value)
}
