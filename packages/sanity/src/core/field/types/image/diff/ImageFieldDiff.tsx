import type {Image} from '@sanity/types'
import React from 'react'
import {Box, Card, Text} from '@sanity/ui'
import {DiffCard, DiffTooltip, ChangeList, getAnnotationAtPath} from '../../../diff'
import {type TFunction, useTranslation} from '../../../../i18n'
import type {DiffComponent, ObjectDiff} from '../../../types'
import {FromTo} from '../../../diff/components'
import {ImagePreview, NoImagePreview} from './ImagePreview'

const IMAGE_META_FIELDS = ['crop', 'hotspot']
const BASE_IMAGE_FIELDS = ['asset', ...IMAGE_META_FIELDS]

const CARD_STYLES = {
  flex: 1,
}

export const ImageFieldDiff: DiffComponent<ObjectDiff<Image>> = ({diff, schemaType}) => {
  const {t} = useTranslation()

  const {fromValue, toValue, fields, isChanged} = diff
  const fromRef = fromValue?.asset?._ref
  const toRef = toValue?.asset?._ref
  const assetAnnotation = getAnnotationAtPath(diff, ['asset', '_ref'])

  // Get all the changed fields within this image field
  const changedFields = Object.keys(fields).filter(
    (name) => fields[name].isChanged && name !== '_type',
  )

  const nestedFields = schemaType.fields
    .filter(
      (field) => !BASE_IMAGE_FIELDS.includes(field.name) && changedFields.includes(field.name),
    )
    .map((field) => field.name)

  let assetAction: 'changed' | 'added' | 'removed' = 'changed'
  if (!fromRef && toRef) {
    assetAction = 'added'
  } else if (!toRef && fromRef) {
    assetAction = 'removed'
  }

  const didAssetChange = changedFields.includes('asset')
  const didCropChange = changedFields.includes('crop')
  const didHotspotChange = changedFields.includes('hotspot')
  const didMetaChange = didCropChange || didHotspotChange
  const showImageDiff = didAssetChange || didMetaChange
  const showMetaChange = didMetaChange && !didAssetChange

  const from =
    fromValue && fromRef ? (
      <DiffCard annotation={assetAnnotation} style={CARD_STYLES}>
        <ImagePreview
          is="from"
          id={fromRef}
          diff={diff}
          action={assetAction}
          hotspot={showMetaChange && didHotspotChange ? fromValue.hotspot : undefined}
          crop={showMetaChange && didCropChange ? fromValue.crop : undefined}
        />
      </DiffCard>
    ) : (
      <NoImagePreview />
    )

  const to =
    toValue && toRef ? (
      <DiffCard annotation={assetAnnotation} style={CARD_STYLES}>
        <ImagePreview
          is="to"
          id={toRef}
          diff={diff}
          hotspot={showMetaChange && didHotspotChange ? toValue.hotspot : undefined}
          crop={showMetaChange && didCropChange ? toValue.crop : undefined}
        />
      </DiffCard>
    ) : (
      <NoImagePreview />
    )

  if (!from && !to) {
    return (
      <Card padding={4} radius={2} tone="transparent">
        <Text muted size={1} align="center">
          {t('changes.image.no-asset-set')}
        </Text>
      </Card>
    )
  }

  if (!isChanged) {
    return toRef ? (
      <DiffCard annotation={assetAnnotation} style={CARD_STYLES}>
        <ImagePreview id={toRef} is="to" diff={diff} />
      </DiffCard>
    ) : null
  }

  const imageDiff = <FromTo align="center" from={from} layout="grid" to={to} />

  return (
    <>
      {showImageDiff &&
        (didAssetChange ? (
          <DiffTooltip
            annotations={assetAnnotation ? [assetAnnotation] : []}
            description={getChangeDescription(assetAction, t)}
          >
            {imageDiff}
          </DiffTooltip>
        ) : (
          imageDiff
        ))}
      {nestedFields.length > 0 && (
        <Box marginTop={showImageDiff ? 4 : 3}>
          <ChangeList diff={diff} schemaType={schemaType} fields={nestedFields} />
        </Box>
      )}
    </>
  )
}

function getChangeDescription(action: 'changed' | 'added' | 'removed', t: TFunction): string {
  switch (action) {
    case 'changed':
      return t('changes.changed-label')
    case 'added':
      return t('changes.added-label')
    case 'removed':
      return t('changes.removed-label')
    default:
      // Should never happen, but for linters' sake
      return 'Unknown change'
  }
}
