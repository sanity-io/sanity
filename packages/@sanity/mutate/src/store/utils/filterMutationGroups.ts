import {type Mutation} from '../../mutations/types'
import {type MutationGroup} from '../types'
import {getMutationDocumentId} from './getMutationDocumentId'

export function filterMutationGroupsById(
  mutationGroups: MutationGroup[],
  id: string,
): Mutation[] {
  return mutationGroups.flatMap(mutationGroup =>
    mutationGroup.mutations.flatMap(mut =>
      getMutationDocumentId(mut) === id ? [mut] : [],
    ),
  )
}
