import {Box, rem, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useMemo} from 'react'

import {useTranslation} from '../../../i18n'
import {type Annotation, type FieldChangeNode, type FromToIndex} from '../../types'
import {getAnnotationAtPath} from '../annotations'
import {annotationText, paddingVar, radiusVar, roundedCard} from './ChangeTitleSegment.css'
import {DiffCard} from './DiffCard'

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
  const {radius, space} = useThemeV2()
  const readableIndex = toIndex + 1
  const description = t('changes.array.item-added-in-position', {position: readableIndex})
  const content = <>#{readableIndex}</>
  const diffAnnotation = change?.diff ? getAnnotationAtPath(change.diff, []) : undefined
  const annotation = diffAnnotation || annotationProp

  const roundedCardVars = useMemo(
    () =>
      assignInlineVars({
        [radiusVar]: String(rem(radius[2])),
        [paddingVar]: String(rem(space[1])),
      }),
    [radius, space],
  )

  if (annotation) {
    return (
      <DiffCard annotation={annotation} tooltip={{description}} as="div">
        <div className={roundedCard} style={roundedCardVars}>
          <Text
            className={annotationText}
            size={1}
            weight="medium"
            as="ins"
            style={{textDecoration: 'none'}}
          >
            {content}
          </Text>
        </div>
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
  const {radius, space} = useThemeV2()
  const readableIndex = fromIndex + 1
  const description = t('changes.array.item-removed-from-position', {position: readableIndex})

  const roundedCardVars = useMemo(
    () => assignInlineVars({[radiusVar]: rem(radius[2]), [paddingVar]: rem(space[1])}),
    [radius, space],
  )

  return (
    <DiffCard annotation={annotation || null} as="div" tooltip={{description}}>
      <div className={roundedCard} style={roundedCardVars}>
        <Text className={annotationText} size={1} weight="medium" forwardedAs="del">
          #{readableIndex}
        </Text>
      </div>
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
  const {radius, space} = useThemeV2()
  const indexDiff = toIndex - fromIndex
  const indexSymbol = indexDiff < 0 ? '↑' : '↓'
  const positions = Math.abs(indexDiff)
  const direction = indexDiff < 0 ? 'up' : 'down'
  const description = t('changes.array.item-moved', {
    count: positions,
    context: direction,
  })

  const roundedCardVars = useMemo(
    () => assignInlineVars({[radiusVar]: rem(radius[2]), [paddingVar]: rem(space[1])}),
    [radius, space],
  )

  return (
    <>
      <Box padding={1}>
        <Text className={annotationText} size={1} weight="medium">
          #{toIndex + 1}
        </Text>
      </Box>
      <DiffCard annotation={annotation} as="div" tooltip={{description}}>
        <div className={roundedCard} style={roundedCardVars}>
          <Text className={annotationText} size={1} weight="medium">
            {indexSymbol}
            {Math.abs(indexDiff)}
          </Text>
        </div>
      </DiffCard>
    </>
  )
}
