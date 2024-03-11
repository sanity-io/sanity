import {applyPatches} from '../apply'
import {
  type Mutation,
  type NodePatch,
  type PatchMutation,
  type SanityDocumentBase,
} from '../mutations/types'
import {getAtPath} from '../path'
import {applyAll} from './datasets/applyDocumentMutation'
import {compactDMPSetPatches} from './optimizations/squashNodePatches'
import {type MutationGroup} from './types'
import {getMutationDocumentId} from './utils/getMutationDocumentId'

type RebaseTransaction = {
  mutations: Mutation[]
}

type FlatMutation = Exclude<Mutation, PatchMutation>

function flattenMutations(mutations: Mutation[]) {
  return mutations.flatMap((mut): Mutation | Mutation[] => {
    if (mut.type === 'patch') {
      return mut.patches.map(
        (patch): PatchMutation => ({
          type: 'patch',
          id: mut.id,
          patches: [patch],
        }),
      )
    }
    return mut
  })
}

export function rebase(
  documentId: string,
  oldBase: SanityDocumentBase | undefined,
  newBase: SanityDocumentBase | undefined,
  stagedMutations: MutationGroup[],
): [newStage: MutationGroup[], rebased: SanityDocumentBase | undefined] {
  // const flattened = flattenMutations(newStage.flatMap(t => t.mutations))

  // 1. get the dmpified mutations from the newStage based on the old base
  // 2. apply those to the new base
  // 3. convert those back into set patches based on the new base and return as a new newStage
  let edge = oldBase
  const dmpified = stagedMutations.map(transaction => {
    const mutations = transaction.mutations.flatMap(mut => {
      if (getMutationDocumentId(mut) !== documentId) {
        return []
      }
      const before = edge
      edge = applyAll(edge, [mut])
      if (!before) {
        return mut
      }
      if (mut.type !== 'patch') {
        return mut
      }
      return {
        type: 'dmpified' as const,
        mutation: {
          ...mut,
          // Todo: make compactDMPSetPatches return pairs of patches that was dmpified with their
          //  original as dmpPatches and original is not 1:1 (e..g some of the original may not be dmpified)
          dmpPatches: compactDMPSetPatches(before, mut.patches as NodePatch[]),
          original: mut.patches,
        },
      }
    })
    return {...transaction, mutations}
  })

  let newBaseWithDMPForOldBaseApplied: SanityDocumentBase | undefined = newBase
  // NOTE: It might not be possible to apply them - if so, we fall back to applying the pending changes
  // todo: revisit this
  const appliedCleanly = dmpified.map(transaction => {
    const applied = []
    return transaction.mutations.forEach(mut => {
      if (mut.type === 'dmpified') {
        // go through all dmpified, try to apply, if they fail, use the original un-optimized set patch instead
        try {
          newBaseWithDMPForOldBaseApplied = applyPatches(
            mut.mutation.dmpPatches,
            newBaseWithDMPForOldBaseApplied,
          )
          applied.push(mut)
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to apply dmp patch, falling back to original')
          try {
            newBaseWithDMPForOldBaseApplied = applyPatches(
              mut.mutation.original,
              newBaseWithDMPForOldBaseApplied,
            )
            applied.push(mut)
          } catch (second: any) {
            throw new Error(
              `Failed to apply patch for document "${documentId}": ${second.message}`,
            )
          }
        }
      } else {
        newBaseWithDMPForOldBaseApplied = applyAll(
          newBaseWithDMPForOldBaseApplied,
          [mut],
        )
      }
    })
  })

  const newStage = stagedMutations.map((transaction): MutationGroup => {
    // update all set patches to set to the current value
    return {
      ...transaction,
      mutations: transaction.mutations.map(mut => {
        if (mut.type !== 'patch' || getMutationDocumentId(mut) !== documentId) {
          return mut
        }
        return {
          ...mut,
          patches: mut.patches.map(patch => {
            if (patch.op.type !== 'set') {
              return patch
            }
            return {
              ...patch,
              op: {
                ...patch.op,
                value: getAtPath(patch.path, newBaseWithDMPForOldBaseApplied),
              },
            }
          }),
        }
      }),
    }
  })
  return [newStage, newBaseWithDMPForOldBaseApplied]
}
