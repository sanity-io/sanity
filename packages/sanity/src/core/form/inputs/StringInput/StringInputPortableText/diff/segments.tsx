import {type StringDiffSegment} from '@sanity/diff'
import {ElementTone} from '@sanity/ui/theme'
import {vars} from '@sanity/ui/css'
import {type ComponentType, type PropsWithChildren} from 'react'
import {styled} from 'styled-components'

import {RELEASE_TYPES_TONES} from '../../../../../releases/util/const'
import {getReleaseTone} from '../../../../../releases/util/getReleaseTone'
import {type ProvenanceDiffAnnotation} from '../../../../store/types/diff'

interface StyledSegmentProps {
  $tone?: ElementTone
}

const Segment = styled.span<StyledSegmentProps>`
  ${({$tone}) => {
    if (typeof $tone === 'undefined') {
      return undefined
    }

    return {
      backgroundColor: vars.color.tinted[$tone].bg[2],
      color: vars.color.tinted[$tone].fg[1],
      textDecoration: 'none',
    }
  }}
`

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

function segmentTone(
  segment: StringDiffSegment<ProvenanceDiffAnnotation>,
): ElementTone | undefined {
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
