import {Card, rem, Text} from '@sanity/ui'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useMemo} from 'react'

import {useTranslation} from '../../../i18n'
import {type StringDiff, type StringDiffSegment} from '../../types'
import {DiffCard} from './DiffCard'
import {changeSegment, radiusVar, roundedCard} from './DiffString.css'

/** @internal */
export function DiffStringSegment(props: {segment: StringDiffSegment}): React.JSX.Element {
  const {segment} = props
  const {text} = segment
  const {t} = useTranslation()
  const {radius} = useThemeV2()

  const roundedCardVars = useMemo(
    () => assignInlineVars({[radiusVar]: rem(radius[1])}),
    [radius],
  )

  if (segment.action === 'added') {
    return (
      <DiffCard
        annotation={segment.annotation}
        disableHoverEffect
        tooltip={{description: t('changes.added-label')}}
        as="span"
      >
        <span className={roundedCard} style={roundedCardVars}>
          <Text className={changeSegment} as="ins" style={{textDecoration: 'none'}}>
            {text}
          </Text>
        </span>
      </DiffCard>
    )
  }

  if (segment.action === 'removed') {
    return (
      <DiffCard
        annotation={segment.annotation}
        as="span"
        disableHoverEffect
        tooltip={{description: t('changes.removed-label')}}
      >
        <span className={roundedCard} style={roundedCardVars}>
          <Text className={changeSegment} as="del">{text}</Text>
        </span>
      </DiffCard>
    )
  }

  return (
    <Card as="span" radius={2} style={{display: 'inline'}}>
      {text}
    </Card>
  )
}

/** @internal */
export function DiffString(props: {diff: StringDiff}) {
  const {diff} = props

  return (
    <>
      {(diff.segments || []).map((segment, segmentIndex) => (
        <DiffStringSegment
          // oxlint-disable-next-line no-array-index-key
          key={segmentIndex}
          segment={segment}
        />
      ))}
    </>
  )
}
