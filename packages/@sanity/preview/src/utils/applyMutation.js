// @flow
import {Mutation} from '@sanity/mutator'

export default function applyMutations(doc: Document, mutations: Mutation[]) {
  return new Mutation({mutations: mutations}).apply(doc)
}
