import {type RangeDecoration} from '@portabletext/editor'
import {type DiffMatchPatch} from '@portabletext/patches'
import {isPortableTextBlock} from '@portabletext/toolkit'
import {applyPatches, parsePatch} from '@sanity/diff-match-patch'
import {arrayToJSONMatchPath, extractWithPath} from '@sanity/mutator'
import {type PortableTextBlock} from '@sanity/types'
import {set} from 'lodash'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {type TargetPerspective} from '../../../../perspective/types'
import {type BaseInputProps} from '../../../types/inputProps'
import {computeRangeDecorationsForPortableText} from './computeRangeDecorationsForPortableText'
import {diffMatchPatchToPortableText} from './diffMatchPatchToPortableText'

export interface PortableTextOptimisticDiffOptions extends Pick<
  BaseInputProps,
  'displayInlineChanges'
> {
  upstreamValue: PortableTextBlock[] | undefined
  definitiveValue: PortableTextBlock[] | undefined
  perspective?: TargetPerspective
}

export interface PortableTextOptimisticDiffApi {
  rangeDecorations: RangeDecoration[]
  onOptimisticChange: (patch: DiffMatchPatch) => void
}

export function useOptimisticPortableTextDiff({
  upstreamValue,
  definitiveValue,
  perspective,
  displayInlineChanges,
}: PortableTextOptimisticDiffOptions): PortableTextOptimisticDiffApi {
  // Buffer the optimistic value of the block the user most recently edited. This is computed by
  // applying patches to the block's current value as soon as they are emitted by the
  // Portable Text Editor.
  //
  // This implementation currently buffers only a single block at a time, which means optimistic
  // diff decorations may briefly disappear if the user begins editing another block before their
  // current changes have fully propagated.
  const [optimisticValue, setOptimisticValue] = useState<PortableTextBlock | undefined>()

  // Merge the definitive and optimistic range decorations, giving precedence to the optimistic ones.
  const rangeDecorations = useMemo(() => {
    if (!displayInlineChanges) {
      return []
    }

    if (typeof perspective === 'undefined') {
      return []
    }

    const definitiveRangeDecorations = computeRangeDecorationsForPortableText({
      perspective,
      upstreamValue,
      value: definitiveValue,
    })

    const optimisticRangeDecorations = computeRangeDecorationsForPortableText({
      perspective,
      upstreamValue,
      value: typeof optimisticValue === 'undefined' ? [] : [optimisticValue],
    })

    return Object.values(optimisticRangeDecorations)
      .concat(
        Object.entries(definitiveRangeDecorations)
          .filter(([blockKey]) => typeof optimisticRangeDecorations[blockKey] === 'undefined')
          .map(([, blockRangeDecorations]) => blockRangeDecorations),
      )
      .flat()
  }, [definitiveValue, displayInlineChanges, optimisticValue, perspective, upstreamValue])

  const onOptimisticChange = useCallback<PortableTextOptimisticDiffApi['onOptimisticChange']>(
    (patch) => {
      if (!displayInlineChanges) {
        return
      }

      const [rootPathSegment] = patch.path

      if (typeof rootPathSegment !== 'object' || !('_key' in rootPathSegment)) {
        return
      }

      // Find the first block in the optimistic or definitive values that contains the the changed
      // node, giving precedence to the optimistic value.
      const rootBlock = [optimisticValue]
        .concat(definitiveValue)
        .find(
          (subject) =>
            typeof subject !== 'undefined' &&
            isPortableTextBlock(subject) &&
            subject._key === rootPathSegment._key,
        )

      // If the node cannot be found in the optimistic or definitive values, the user has just
      // created it. To handle this, create a skeleton Portable Text Block to optimistically
      // represent the created block.
      if (typeof rootBlock === 'undefined') {
        const insertedBlock = diffMatchPatchToPortableText(patch)
        setOptimisticValue(insertedBlock)
        return
      }

      // Find the changed node in the optimistic or definitive root block.
      const [node] = extractWithPath(arrayToJSONMatchPath(patch.path), rootBlock)

      // If the node still cannot be found for any reason after all other work has been performed,
      // skip optimistic state update.
      //
      // This allows Portable Text Editor to continue operating without error. The updated diff will
      // still appear, but only after the change has propagated through the data layer.
      //
      // This may occur if a Portable Text Editor patch occurs that changes the value, but that
      // the optimistic change handler doesn't expect.
      if (typeof node === 'undefined') {
        return
      }

      // Apply the patch to the node.
      const [nextNodeValue] = applyPatches(
        parsePatch(patch.value),
        typeof node.value === 'string' ? node.value : '',
      )

      // Create a new Portable Text block with the patch applied.
      const nextOptimisticValue = set<PortableTextBlock>(
        typeof rootBlock === 'undefined' ? {} : structuredClone(rootBlock),
        node?.path,
        nextNodeValue,
      )

      setOptimisticValue(nextOptimisticValue)
    },
    [definitiveValue, displayInlineChanges, optimisticValue],
  )

  // Reset the optimistic state after receiving definitive state.
  useEffect(() => {
    setOptimisticValue(undefined)
  }, [definitiveValue])

  return {
    rangeDecorations,
    onOptimisticChange,
  }
}
