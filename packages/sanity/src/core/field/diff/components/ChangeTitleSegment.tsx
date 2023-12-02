import React from 'react'
import {Box, rem, Text} from '@sanity/ui'
import styled from 'styled-components'
import {useTranslation} from '../../../i18n'
import type {FromToIndex, Annotation, FieldChangeNode} from '../../types'
import {getAnnotationAtPath} from '../annotations'
import {DiffCard} from './DiffCard'

const RoundedCard = styled.div`
  border-radius: ${({theme}) => rem(theme.sanity.radius[2])};
  padding: ${({theme}) => rem(theme.sanity.space[1])};
`

const AnnotationText = styled(Text)`
  &:not([hidden]) {
    color: inherit;
  }
`

/** @internal */
export function ChangeTitleSegment(props: {
  change?: FieldChangeNode
  segment: string | FromToIndex
}) {
  const {change, segment} = props

  if (typeof segment === 'string') {
    return (
      <Box>
        <Text title={segment} size={1} weight="medium" textOverflow="ellipsis">
          {segment}
        </Text>
      </Box>
    )
  }

  const {hasMoved, fromIndex, toIndex, annotation} = segment
  const created = typeof fromIndex === 'undefined'
  const deleted = typeof toIndex === 'undefined'
  if (created) {
    // Item was created
    return <CreatedTitleSegment annotation={annotation} change={change} toIndex={toIndex} />
  }

  if (deleted) {
    // Item was deleted
    return <DeletedTitleSegment annotation={annotation} fromIndex={fromIndex} />
  }

  if (hasMoved && typeof toIndex !== 'undefined' && typeof fromIndex !== 'undefined') {
    // Item was moved
    return <MovedTitleSegment annotation={annotation} fromIndex={fromIndex} toIndex={toIndex} />
  }

  // Changed/unchanged
  const readableIndex = (toIndex || 0) + 1
  return (
    <Box padding={1}>
      <Text size={1} weight="medium">
        #{readableIndex}
      </Text>
    </Box>
  )
}

function CreatedTitleSegment(props: {
  annotation: Annotation | undefined
  change?: FieldChangeNode
  toIndex?: number
}) {
  const {annotation: annotationProp, change, toIndex = 0} = props
  const {t} = useTranslation()
  const readableIndex = toIndex + 1
  const description = t('changes.array.item-added-in-position', {position: readableIndex})
  const content = <>#{readableIndex}</>
  const diffAnnotation = change?.diff ? getAnnotationAtPath(change.diff, []) : undefined
  const annotation = diffAnnotation || annotationProp

  if (annotation) {
    return (
      <DiffCard annotation={annotation} tooltip={{description}} as={RoundedCard}>
        <AnnotationText size={1} weight="medium" forwardedAs="ins" style={{textDecoration: 'none'}}>
          {content}
        </AnnotationText>
      </DiffCard>
    )
  }

  return (
    <Text size={1} weight="medium">
      {content}
    </Text>
  )
}

function DeletedTitleSegment(props: {annotation: Annotation | undefined; fromIndex?: number}) {
  const {annotation, fromIndex = 0} = props
  const {t} = useTranslation()
  const readableIndex = fromIndex + 1
  const description = t('changes.array.item-removed-from-position', {position: readableIndex})
  return (
    <DiffCard annotation={annotation || null} as={RoundedCard} tooltip={{description}}>
      <AnnotationText size={1} weight="medium" forwardedAs="del">
        #{readableIndex}
      </AnnotationText>
    </DiffCard>
  )
}

function MovedTitleSegment(props: {
  annotation: Annotation | undefined
  fromIndex: number
  toIndex: number
}) {
  const {annotation, fromIndex, toIndex} = props
  const {t} = useTranslation()
  const indexDiff = toIndex - fromIndex
  const indexSymbol = indexDiff < 0 ? '↑' : '↓'
  const positions = Math.abs(indexDiff)
  const direction = indexDiff < 0 ? 'up' : 'down'
  const description = t('changes.array.item-moved', {
    count: positions,
    context: direction,
  })

  return (
    <>
      <Box padding={1}>
        <AnnotationText size={1} weight="medium">
          #{toIndex + 1}
        </AnnotationText>
      </Box>
      <DiffCard annotation={annotation} as={RoundedCard} tooltip={{description}}>
        <AnnotationText size={1} weight="medium">
          {indexSymbol}
          {Math.abs(indexDiff)}
        </AnnotationText>
      </DiffCard>
    </>
  )
}
