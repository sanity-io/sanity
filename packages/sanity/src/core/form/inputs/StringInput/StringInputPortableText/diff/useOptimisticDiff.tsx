import {type RangeDecoration} from '@portabletext/editor'
import {type Diff} from '@sanity/diff'
import {applyPatches, parsePatch} from '@sanity/diff-match-patch'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {type ProvenanceDiffAnnotation} from '../../../../store/types/diff'
import {type ComputeDiff} from '../../../../store/types/nodes'
import {computeStringDiffRangeDecorations} from '../../../common/diff/string/computeStringDiffRangeDecorations'

type InputOrigin = 'optimistic' | 'definitive'

export interface OptimisticDiffOptions {
  definitiveValue: string | undefined
  computeDiff: ComputeDiff<ProvenanceDiffAnnotation>
}

export interface OptimisticDiffApi {
  diff: Diff<ProvenanceDiffAnnotation>
  rangeDecorations: RangeDecoration[]
  onOptimisticChange: (value: string) => void
}

export function useOptimisticDiff({
  definitiveValue,
  computeDiff,
}: OptimisticDiffOptions): OptimisticDiffApi {
  const [optimisticValue, setOptimisticValue] = useState(definitiveValue)
  const [currentSignal, setCurrentSignal] = useState<InputOrigin>('definitive')

  const diffsBySignal: Record<InputOrigin, Diff<ProvenanceDiffAnnotation>> = {
    optimistic: useMemo(() => computeDiff(optimisticValue), [computeDiff, optimisticValue]),
    definitive: useMemo(() => computeDiff(definitiveValue), [computeDiff, definitiveValue]),
  }

  const diff = diffsBySignal[currentSignal]

  const onOptimisticChange = useCallback(
    (value: string) => {
      const [nextOptimisticValue] = applyPatches(parsePatch(value), optimisticValue ?? '')
      setOptimisticValue(nextOptimisticValue)
      setCurrentSignal('optimistic')
    },
    [optimisticValue],
  )

  useEffect(() => {
    setCurrentSignal('definitive')
    // Ensure the optimistic value is synced with the definitive value.
    setOptimisticValue(definitiveValue)
  }, [definitiveValue])

  const rangeDecorations = useMemo(
    () =>
      computeStringDiffRangeDecorations({
        diff,
        mapPayload: (payload) => ({
          ...payload,
          // Including the current signal in the payload ensures that the range decorations are
          // rerendered when the signal changes.
          currentSignal,
        }),
      }),
    [diff, currentSignal],
  )

  return {
    diff,
    rangeDecorations,
    onOptimisticChange,
  }
}
