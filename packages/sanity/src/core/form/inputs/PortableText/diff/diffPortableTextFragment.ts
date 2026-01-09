import {isPortableTextBlock, toPlainText} from '@portabletext/toolkit'
import {type Diff, diffInput, wrap} from '@sanity/diff'
import {type PortableTextBlock} from '@sanity/types'

import {type TargetPerspective} from '../../../../perspective/types'
import {type ProvenanceDiffAnnotation} from '../../../store/types/diff'

export interface DiffPortableTextFragmentOptions {
  upstreamValue?: PortableTextBlock[]
  value?: PortableTextBlock[]
  selector: (value: PortableTextBlock[]) => PortableTextBlock | undefined
  perspective: TargetPerspective
}

export interface DiffPortableTextFragmentApi {
  isAdded: boolean
  isRemoved: boolean
  stringDiff: Diff<ProvenanceDiffAnnotation>
}

/**
 * This function produces the diff of a single Portable Text block in the context of two
 * Portable Text arrays (the current value and its upstream value).
 *
 * Providing the entire array of Portable Text blocks allows the function to determine whether the
 * target block has been added or removed.
 *
 * The target block is selected using the provided `selector` function.
 */
export function diffPortableTextFragment({
  upstreamValue = [],
  value = [],
  selector,
  perspective,
}: DiffPortableTextFragmentOptions): DiffPortableTextFragmentApi {
  const upstreamSelection = selector(upstreamValue)
  const selection = selector(value)

  const isAdded = typeof upstreamSelection === 'undefined' && typeof selection !== 'undefined'
  const isRemoved = typeof upstreamSelection !== 'undefined' && typeof selection === 'undefined'

  const upstreamTextContent =
    typeof upstreamSelection !== 'undefined' && isPortableTextBlock(upstreamSelection)
      ? toPlainText(upstreamSelection)
      : ''

  const textContent =
    typeof selection !== 'undefined' && isPortableTextBlock(selection) ? toPlainText(selection) : ''

  const provenanceAnnotation: ProvenanceDiffAnnotation = {
    provenance: {
      bundle: perspective,
    },
  }

  const stringDiff = diffInput<ProvenanceDiffAnnotation>(
    wrap(upstreamTextContent, provenanceAnnotation),
    wrap(textContent, provenanceAnnotation),
    {},
  )

  return {
    isAdded,
    isRemoved,
    stringDiff,
  }
}
