import {Card, rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type CSSProperties} from 'react'
import {Text} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type StringDiff, type StringDiffSegment} from '../../types'
import {DiffCard} from './DiffCard'
import {changeSegment, radius1Var, roundedCard} from './DiffString.css'

function RoundedCard(props: ComponentProps<'span'>) {
  const {className, style, ...rest} = props
  const {radius} = useThemeV2()

  return (
    <span
      {...rest}
      className={clsx(roundedCard, className)}
      style={{[radius1Var]: `${rem(radius[1])}`, ...style} as CSSProperties}
    />
  )
}

function ChangeSegment(props: ComponentProps<typeof Text>) {
  const {className, ...rest} = props

  return <Text {...rest} className={clsx(changeSegment, className)} />
}

/** @internal */
export function DiffStringSegment(props: {segment: StringDiffSegment}): React.JSX.Element {
  const {segment} = props
  const {text} = segment
  const {t} = useTranslation()

  if (segment.action === 'added') {
    return (
      <DiffCard
        annotation={segment.annotation}
        disableHoverEffect
        tooltip={{description: t('changes.added-label')}}
        as={RoundedCard}
      >
        <ChangeSegment as="ins" style={{textDecoration: 'none'}}>
          {text}
        </ChangeSegment>
      </DiffCard>
    )
  }

  if (segment.action === 'removed') {
    return (
      <DiffCard
        annotation={segment.annotation}
        as={RoundedCard}
        disableHoverEffect
        tooltip={{description: t('changes.removed-label')}}
      >
        <ChangeSegment as="del">{text}</ChangeSegment>
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
