import {Text, Card, rem} from '@sanity/ui'
import * as React from 'react'
import styled from 'styled-components'
import {StringDiffSegment, StringDiff} from '../../types'
import {DiffCard} from './DiffCard'

const RoundedCard = styled.span`
  border-radius: ${({theme}) => rem(theme.sanity.radius[1])};
`

const ChangeSegment = styled(Text)`
  &:not([hidden]) {
    display: inline;
    line-height: calc(1.25em + 2px);
  }

  &:hover {
    background-color: none !important;
    background-image: linear-gradient(
      to bottom,
      var(--card-bg-color) 0,
      var(--card-bg-color) 33.333%,
      currentColor 33.333%,
      currentColor 100%
    );
    background-size: 1px 3px;
    background-repeat: repeat-x;
    background-position-y: bottom;
    padding-bottom: 3px;
    box-shadow: 0 0 0 1px var(--card-bg-color);
    z-index: 1;
  }
`

export function DiffStringSegment({segment}: {segment: StringDiffSegment}): React.ReactElement {
  const {text} = segment

  if (segment.action === 'added') {
    return (
      <DiffCard
        annotation={segment.annotation}
        disableHoverEffect
        tooltip={{description: 'Added'}}
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
        tooltip={{description: 'Removed'}}
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

export function DiffString({diff}: {diff: StringDiff}) {
  return (
    <>
      {(diff.segments || []).map((segment, segmentIndex) => (
        <DiffStringSegment
          // eslint-disable-next-line react/no-array-index-key
          key={segmentIndex}
          segment={segment}
        />
      ))}
    </>
  )
}
