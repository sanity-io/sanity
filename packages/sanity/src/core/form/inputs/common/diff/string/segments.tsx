import {type StringDiffSegment} from '@sanity/diff'
import {type BadgeTone, type ButtonTone,useTheme_v2 as useThemeV2} from '@sanity/ui'
 
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ComponentType, type PropsWithChildren} from 'react'

import {RELEASE_TYPES_TONES} from '../../../../../releases/util/const'
import {getReleaseTone} from '../../../../../releases/util/getReleaseTone'
import {type ProvenanceDiffAnnotation} from '../../../../store/types/diff'
import {bgColorVar, fgColorVar, segment} from './segments.css'

interface SegmentProps {
  segment: StringDiffSegment<ProvenanceDiffAnnotation>
}

function useSegmentStyle(tone?: ButtonTone) {
  const {color} = useThemeV2()
  if (typeof tone === 'undefined') {
    return undefined
  }
  const toneColors = color.button.bleed[tone]
  return assignInlineVars({
    [bgColorVar]: toneColors?.pressed?.bg || 'transparent',
    [fgColorVar]: toneColors?.pressed?.fg || 'inherit',
  })
}

export const Segment = segment

export const DeletedSegment: ComponentType<SegmentProps> = ({segment: seg}) => {
  const style = useSegmentStyle('critical')
  return (
    <del
      className={segment}
      data-text={seg.text}
      contentEditable={false}
      aria-hidden
      style={style}
    />
  )
}

export const InsertedSegment: ComponentType<PropsWithChildren<SegmentProps>> = ({
  children,
  segment: seg,
}) => {
  const tone = segmentTone(seg)
  const style = useSegmentStyle(tone)
  return (
    <ins className={segment} style={style}>
      {children}
    </ins>
  )
}

function segmentTone(seg: StringDiffSegment<ProvenanceDiffAnnotation>): BadgeTone | undefined {
  if (
    seg.action !== 'unchanged' &&
    typeof seg.annotation.provenance.bundle !== 'undefined'
  ) {
    if (seg.annotation.provenance.bundle === 'drafts') {
      return RELEASE_TYPES_TONES.asap.tone
    }

    return getReleaseTone(seg.annotation.provenance.bundle)
  }

  return undefined
}
