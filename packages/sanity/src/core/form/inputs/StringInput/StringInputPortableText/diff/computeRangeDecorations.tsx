import {type EditorSelection, type RangeDecoration} from '@portabletext/editor'
import {type Diff} from '@sanity/diff'

import {type ProvenanceDiffAnnotation} from '../../../../store/types/diff'
import {DeletedSegment, InsertedSegment} from '../../../common/diff/string/segments'
import {ROOT_PATH} from '../StringInputPortableText'

interface ComputeRangeDecorationsOptions {
  diff: Diff<ProvenanceDiffAnnotation>
  mapPayload?: (payload: Record<string, unknown>) => Record<string, unknown>
}

export function computeRangeDecorations({
  diff,
  mapPayload = (payload) => payload,
}: ComputeRangeDecorationsOptions): RangeDecoration[] {
  if (diff.type !== 'string') {
    return []
  }

  const segments = diff?.segments ?? []

  const {rangeDecorations} = segments.reduce<{
    rangeDecorations: RangeDecoration[]
    position: number
  }>(
    (state, segment, index) => {
      const previousSegment = segments.at(index - 1)
      const previousDecoration = state.rangeDecorations.at(-1)

      // Overlapping ranges cannot be given separate decorations. String diffs are calculated
      // such that this is only a concern if an added segment immediately proceeds a removed
      // segment; in this scenario, the removed segment decorates the starting position of the
      // added segment. To solve this problem, the removed and added decorations are merged.
      if (
        segment.action === 'added' &&
        previousDecoration?.payload?.action === 'removed' &&
        typeof previousSegment !== 'undefined'
      ) {
        const isOverlapping = previousDecoration?.selection?.anchor?.offset === state.position

        if (isOverlapping) {
          state.rangeDecorations.splice(state.rangeDecorations.length - 1, 1, {
            selection: rangeDecorationSelection(
              state.position,
              state.position + segment.text.length,
            ),
            component: ({children}) => {
              return (
                <span>
                  <previousDecoration.component />
                  <InsertedSegment segment={segment}>{children}</InsertedSegment>
                </span>
              )
            },
            payload: mapPayload({
              id: segmentId(
                previousDecoration?.payload?.action,
                previousSegment.text,
                'added',
                segment.text,
              ),
              action: 'merged',
            }),
          })

          state.position += segment.text.length
          return state
        }
      }

      if (segment.action === 'added') {
        state.rangeDecorations.push({
          selection: rangeDecorationSelection(state.position, state.position + segment.text.length),
          component: (props) => <InsertedSegment segment={segment} {...props} />,
          payload: mapPayload({
            id: segmentId('added', segment.text),
            action: segment.action,
          }),
        })

        state.position += segment.text.length
        return state
      }

      if (segment.action === 'removed') {
        state.rangeDecorations.push({
          selection: rangeDecorationSelection(state.position, state.position),
          component: () => <DeletedSegment segment={segment} />,
          payload: mapPayload({
            id: segmentId('removed', segment.text),
            action: segment.action,
          }),
        })

        return state
      }

      if (segment.action === 'unchanged') {
        state.position += segment.text.length
        return state
      }

      return state
    },
    {
      position: 0,
      rangeDecorations: [],
    },
  )

  return rangeDecorations
}

function segmentId(...path: string[]): string {
  return path.join('.')
}

function rangeDecorationSelection(anchorOffset: number, focusOffset: number): EditorSelection {
  return {
    anchor: {
      path: ROOT_PATH,
      offset: anchorOffset,
    },
    focus: {
      path: ROOT_PATH,
      offset: focusOffset,
    },
  }
}
