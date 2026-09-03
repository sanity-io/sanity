import {type StringDiffSegment} from '@sanity/diff'
import {type BadgeTone, type ButtonTone, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentType, type PropsWithChildren} from 'react'

import {RELEASE_TYPES_TONES} from '../../../../../releases/util/const'
import {getReleaseTone} from '../../../../../releases/util/getReleaseTone'
import {type ProvenanceDiffAnnotation} from '../../../../store/types/diff'
import {segment as segmentClass, segmentBgVar, segmentFgVar, segmentToned} from './segments.css'

interface StyledSegmentProps {
  $tone?: ButtonTone
}

/** Discriminated on `as` so each tag keeps its own element (and `ref`) type */
type SegmentElementProps =
  | ({as?: 'span'} & ComponentProps<'span'>)
  | ({as: 'del'} & ComponentProps<'del'>)
  | ({as: 'ins'} & ComponentProps<'ins'>)

export function Segment(props: StyledSegmentProps & SegmentElementProps) {
  const {$tone, className, style, ...rest} = props
  const {color} = useThemeV2()
  const toneColor = typeof $tone === 'undefined' ? undefined : color.button.bleed[$tone]?.pressed
  const segmentProps = {
    className: clsx(segmentClass, typeof $tone !== 'undefined' && segmentToned, className),
    style: {
      ...assignInlineVars({
        [segmentBgVar]: toneColor?.bg,
        [segmentFgVar]: toneColor?.fg,
      }),
      ...style,
    },
  }

  if (rest.as === 'del') {
    const {as: _as, ...elementProps} = rest
    return <del {...elementProps} {...segmentProps} />
  }

  if (rest.as === 'ins') {
    const {as: _as, ...elementProps} = rest
    return <ins {...elementProps} {...segmentProps} />
  }

  const {as: _as, ...elementProps} = rest
  return <span {...elementProps} {...segmentProps} />
}

interface SegmentProps {
  segment: StringDiffSegment<ProvenanceDiffAnnotation>
}

export const DeletedSegment: ComponentType<SegmentProps> = ({segment}) => (
  <Segment
    as="del"
    data-text={segment.text}
    contentEditable={false}
    aria-hidden
    inert
    $tone="critical"
  />
)

export const InsertedSegment: ComponentType<PropsWithChildren<SegmentProps>> = ({
  children,
  segment,
}) => {
  return (
    <Segment as="ins" $tone={segmentTone(segment)}>
      {children}
    </Segment>
  )
}

function segmentTone(segment: StringDiffSegment<ProvenanceDiffAnnotation>): BadgeTone | undefined {
  if (
    segment.action !== 'unchanged' &&
    typeof segment.annotation.provenance.bundle !== 'undefined'
  ) {
    if (segment.annotation.provenance.bundle === 'drafts') {
      return RELEASE_TYPES_TONES.asap.tone
    }

    return getReleaseTone(segment.annotation.provenance.bundle)
  }

  return undefined
}
