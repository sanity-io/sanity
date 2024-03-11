import {nanoid} from 'nanoid'

import {type DocumentIndex, type Format} from '../../apply'
import {type Mutation, type SanityDocumentBase} from '../../mutations/types'
import {arrify} from '../../utils/arrify'
import {applyInIndex, type ToIdentified, type ToStored} from '../applyInIndex'
import {assignId} from './utils'

export type RequiredSelect<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: T[P]
}

function update<Doc extends ToIdentified<SanityDocumentBase>>(
  doc: Doc,
  revision: string,
): ToStored<Doc> {
  return {
    ...doc,
    _rev: revision,
    _createdAt: doc._createdAt || new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
  }
}

const empty: DocumentIndex<any> = {}

export const createStore = <Doc extends SanityDocumentBase>(
  initialEntries?: Doc[],
) => {
  let version = 0

  let index: DocumentIndex<Format<ToStored<Doc & SanityDocumentBase>>> =
    initialEntries && initialEntries?.length > 0
      ? Object.fromEntries(
          initialEntries.map(entry => {
            const doc = update(assignId(entry, nanoid), nanoid())
            return [doc._id, doc]
          }),
        )
      : empty

  return {
    get version() {
      return version
    },
    // todo: support listening for changes
    entries: () => Object.entries(index),
    get: <Id extends string>(
      id: Id,
    ): Format<Omit<(typeof index)[keyof typeof index], '_id'> & {_id: Id}> =>
      index[id] as any,
    apply: (mutations: Mutation[] | Mutation) => {
      const nextIndex = applyInIndex(index, arrify(mutations))
      if (nextIndex !== index) {
        index = nextIndex
        version++
      }
    },
  }
}
