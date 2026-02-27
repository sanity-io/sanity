import {type RangeDecoration} from '@portabletext/editor'
import {isPortableTextBlock, toPlainText} from '@portabletext/toolkit'
import {type PortableTextBlock} from '@sanity/types'

import {type TargetPerspective} from '../../../../perspective/types'
import {computeStringDiffRangeDecorations} from '../../common/diff/string/computeStringDiffRangeDecorations'
import {InsertedSegment} from '../../common/diff/string/segments'
import {diffPortableTextFragment} from './diffPortableTextFragment'

export interface ComputeRangeDecorationsForPortableTextOtions {
  value?: PortableTextBlock[]
  upstreamValue?: PortableTextBlock[]
  perspective: TargetPerspective
}

type DecorationsByBlock = Record<string, RangeDecoration[]>

export function computeRangeDecorationsForPortableText({
  value = [],
  upstreamValue = [],
  perspective,
}: ComputeRangeDecorationsForPortableTextOtions): DecorationsByBlock {
  const rangeDecorationsByBlockKey = value.reduce<DecorationsByBlock>((record, block) => {
    const {isAdded, stringDiff} = diffPortableTextFragment({
      upstreamValue,
      value,
      selector: (selectorValue) => selectorValue.find(({_key}) => _key === block._key),
      perspective,
    })

    if (!isPortableTextBlock(block)) {
      return record
    }

    if (block.children.length === 0) {
      return record
    }

    if (isAdded) {
      const textContent = toPlainText(block)

      record[block._key] ??= []

      record[block._key].push({
        selection: {
          anchor: {
            path: [{_key: block._key}],
            offset: 0,
          },
          focus: {
            path: [{_key: block._key}],
            offset: textContent.length,
          },
        },
        component: ({children}) => (
          <InsertedSegment
            segment={{
              action: 'added',
              type: 'stringSegment',
              text: textContent,
              annotation: {
                provenance: {
                  bundle: perspective,
                },
              },
            }}
          >
            {children}
          </InsertedSegment>
        ),
      })

      return record
    }

    if (stringDiff.isChanged) {
      record[block._key] ??= []

      record[block._key].push(
        ...computeStringDiffRangeDecorations({
          diff: stringDiff,
          anchorPath: [{_key: block._key}],
          focusPath: [{_key: block._key}],
        }),
      )

      return record
    }

    // The removal of a block cannot be represented using range decorations.
    return record
  }, {})

  return rangeDecorationsByBlockKey
}
