import i18n from 'i18next'
import k from './../../../../i18n/keys'
import React, {CSSProperties} from 'react'
import {WarningOutlineIcon} from '@sanity/icons'
import {Card, Text, Grid, Flex} from '@sanity/ui'
import {UsageDialogProps} from './AssetUsageDialog'

type ConfirmMessageProps = Omit<UsageDialogProps, 'onClose' | 'onDelete'> & {
  hasResults?: boolean
}

const STYLE_ASSET_IMAGE: CSSProperties = {
  maxWidth: '100%',
  height: '120px',
  objectFit: 'contain',
  objectPosition: 'center',
}
const STYLE_CONFIRM_CARD: CSSProperties = {
  gridColumn: 'span 1',
  overflow: 'hidden',
  display: 'flex',
  alignSelf: 'center',
  justifyContent: 'center',
}
const STYLE_IMAGE_WRAPPER: CSSProperties = {height: '100%'}

export const ConfirmMessage = ({asset, assetType, hasResults = false}: ConfirmMessageProps) => {
  const isImage = assetType === 'image'
  const filenamePlaceholder = asset.originalFilename ? (
    <>
      {i18n.t(k.THE)} {assetType} <strong>{asset.originalFilename}</strong>
    </>
  ) : (
    `this ${assetType}`
  )

  if (hasResults) {
    return (
      <Card tone="caution" padding={[3, 3, 4]} border radius={2} marginBottom={3}>
        <Grid columns={3} gap={[2, 3, 4]}>
          <Flex gap={[3, 4]} align="center" style={{gridColumn: isImage ? 'span 2' : 'span 3'}}>
            <Text>
              <WarningOutlineIcon />
            </Text>
            <Text size={1}>
              {filenamePlaceholder} {i18n.t(k.CANNOT_BE_DELETED_BECAUSE_IT_S)}
              {assetType} {i18n.t(k.YOU_NEED_THE_REMOVE_ALL_USES_O)}
            </Text>
          </Flex>
          {isImage && (
            <Card __unstable_checkered border radius={1} style={STYLE_CONFIRM_CARD}>
              <Flex align="center" justify="center" style={STYLE_IMAGE_WRAPPER}>
                <img
                  src={`${asset.url}?w=200`}
                  style={STYLE_ASSET_IMAGE}
                  alt="Preview of image"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </Flex>
            </Card>
          )}
        </Grid>
      </Card>
    )
  }

  return (
    <Card paddingX={[2, 3, 4]} paddingY={[3, 3, 3, 4]}>
      <Grid columns={3} gap={3}>
        <Flex style={{gridColumn: isImage ? 'span 2' : 'span 3'}} align="center">
          <Text>
            {i18n.t(k.YOU_ARE_ABOUT_TO_DELETE_THE)} {assetType}
            {asset.originalFilename && (
              <>
                {' '}
                <strong>{asset.originalFilename}</strong>
              </>
            )}{' '}
            {i18n.t(k.AND_ITS_METADATA)}
            <br />
            <br />
            {i18n.t(k.ARE_YOU_SURE)}
          </Text>
        </Flex>
        {isImage && (
          <Card __unstable_checkered border radius={1} style={STYLE_CONFIRM_CARD}>
            <Flex align="center" justify="center" style={STYLE_IMAGE_WRAPPER}>
              <img
                src={`${asset.url}?w=200`}
                style={STYLE_ASSET_IMAGE}
                alt="Preview of image"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </Flex>
          </Card>
        )}
      </Grid>
    </Card>
  )
}
