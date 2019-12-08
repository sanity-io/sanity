import client from 'part:@sanity/base/client'
import {checkoutPair} from './checkoutPair'
import createDeprecatedAPIs from './_createDeprecatedAPIs'
import {IdPair} from './types'
import {listenQuery} from './listenQuery'
import {getById} from './buffered'

export default {
  ...createDeprecatedAPIs(client), // Todo: can be removed in ~january 2020
  checkoutPair: (idPair: IdPair) => checkoutPair(client, idPair),
  listenQuery,
  buffered: {
    getById
  }
}
