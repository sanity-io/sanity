import {IdPair} from './types'
import {getPair} from './document-actions'

export function getById(idPair: IdPair) {
  return getPair(idPair)
}
