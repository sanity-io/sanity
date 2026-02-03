import {type StringDiffSegment} from '@sanity/diff'
import {type BadgeTone, type ButtonTone} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ComponentType, type PropsWithChildren} from 'react'
import {styled} from 'styled-components'

import {RELEASE_TYPES_TONES} from '../../../../../releases/util/const'
import {getReleaseTone} from '../../../../../releases/util/getReleaseTone'
import {type ProvenanceDiffAnnotation} from '../../../../store/types/diff'

interface StyledSegmentProps {
  $tone?: ButtonTone
}

export const Segment = styled.span<StyledSegmentProps>`
  ${({theme, $tone}) => {
    if (typeof $tone === 'undefined') {
      return undefined
    }

    const {color} = getTheme_v2(theme)

    return {
      backgroundColor: color.button.bleed[$tone]?.pressed?.bg,
      color: color.button.bleed[$tone]?.pressed?.fg,
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
