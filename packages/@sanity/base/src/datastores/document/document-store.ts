import client from 'part:@sanity/base/client'
import {checkoutPair} from './checkoutPair'
import createDeprecatedAPIs from './_createDeprecatedAPIs'
import {IdPair} from './types'
import {listenQuery} from './listenQuery'
import {editStateOf} from './editor-document/editState'
import {editOpsOf} from './editor-document/editOps'

// Todo: Flush / commit before publish

export default {
  ...createDeprecatedAPIs(client), // Todo: can be removed in ~january 2020
  checkoutPair: (idPair: IdPair) => checkoutPair(client, idPair),
  listenQuery,
  local: {
    editStateOf,
    editOpsOf
  }
}
