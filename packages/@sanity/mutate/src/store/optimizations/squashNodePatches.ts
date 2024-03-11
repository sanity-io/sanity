import {makePatches, stringifyPatches} from '@sanity/diff-match-patch'

import {applyNodePatch} from '../../apply'
import {type Operation} from '../../mutations/operations/types'
import {type NodePatch, type SanityDocumentBase} from '../../mutations/types'
import {getAtPath, type Path, startsWith, stringify} from '../../path'
import {takeUntilRight} from '../utils/arrayUtils'

function isEqualPath(p1: Path, p2: Path) {
  return stringify(p1) === stringify(p2)
}

function supersedes(later: Operation, earlier: Operation) {
  return (
    (earlier.type === 'set' || earlier.type === 'unset') &&
    (later.type === 'set' || later.type === 'unset')
  )
}

export function squashNodePatches(patches: NodePatch[]) {
  return compactSetIfMissingPatches(
    compactSetPatches(compactUnsetPatches(patches)),
  )
}

export function compactUnsetPatches(patches: NodePatch[]) {
  return patches.reduce(
    (earlierPatches: NodePatch[], laterPatch: NodePatch) => {
      if (laterPatch.op.type !== 'unset') {
        earlierPatches.push(laterPatch)
        return earlierPatches
      }
      // find all preceding patches that are affected by this unset
      const unaffected = earlierPatches.filter(
        earlierPatch => !startsWith(laterPatch.path, earlierPatch.path),
      )
      unaffected.push(laterPatch)
      return unaffected
    },
    [],
  )
}

export function compactSetPatches(patches: NodePatch[]) {
  return patches.reduceRight(
    (laterPatches: NodePatch[], earlierPatch: NodePatch) => {
      const replacement = laterPatches.find(
        later =>
          supersedes(later.op, earlierPatch.op) &&
          isEqualPath(later.path, earlierPatch.path),
      )
      if (replacement) {
        // we already have another patch later in the chain that replaces this one
        return laterPatches
      }
      laterPatches.unshift(earlierPatch)
      return laterPatches
    },
    [],
  )
}

export function compactSetIfMissingPatches(patches: NodePatch[]) {
  return patches.reduce(
    (previousPatches: NodePatch[], laterPatch: NodePatch) => {
      if (laterPatch.op.type !== 'setIfMissing') {
        previousPatches.push(laterPatch)
        return previousPatches
      }
      // look at preceding patches up until the first unset
      const check = takeUntilRight(
        previousPatches,
        patch => patch.op.type === 'unset',
      )
      const precedent = check.find(
        precedingPatch =>
          precedingPatch.op.type === 'setIfMissing' &&
          isEqualPath(precedingPatch.path, laterPatch.path),
      )
      if (precedent) {
        // we already have an identical patch earlier in the chain that voids this one
        return previousPatches
      }
      previousPatches.push(laterPatch)
      return previousPatches
    },
    [],
  )
}

export function compactDMPSetPatches(
  base: SanityDocumentBase,
  patches: NodePatch[],
) {
  let edge = base
  return patches.reduce(
    (earlierPatches: NodePatch[], laterPatch: NodePatch) => {
      const before = edge
      edge = applyNodePatch(laterPatch, edge)
      if (
        laterPatch.op.type === 'set' &&
        typeof laterPatch.op.value === 'string'
      ) {
        const current = getAtPath(laterPatch.path, before)
        if (typeof current === 'string') {
          // we can replace the earlier diffMatchPatches with a new one
          const replaced: NodePatch = {
            ...laterPatch,
            op: {
              type: 'diffMatchPatch',
              value: stringifyPatches(
                makePatches(current, laterPatch.op.value),
              ),
            },
          }
          return earlierPatches
            .flatMap(ep => {
              return isEqualPath(ep.path, laterPatch.path) &&
                ep.op.type === 'diffMatchPatch'
                ? []
                : ep
            })
            .concat(replaced)
        }
      }
      earlierPatches.push(laterPatch)
      return earlierPatches
    },
    [],
  )
}
