import React, {CSSProperties} from 'react'
import {WarningOutlineIcon} from '@sanity/icons'
import {Card, Flex, Grid, Text} from '@sanity/ui'
import {Translate, useTranslation} from '../../../../i18n'
import {UsageDialogProps} from './AssetDeleteDialog'

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
  const {t} = useTranslation()

  if (hasResults) {
    return (
      <Card tone="caution" padding={[3, 3, 4]} border radius={2} marginBottom={3}>
        <Grid columns={3} gap={[2, 3, 4]}>
          <Flex gap={[3, 4]} align="center" style={{gridColumn: isImage ? 'span 2' : 'span 3'}}>
            <Text>
              <WarningOutlineIcon />
            </Text>
            <Text size={1}>
              {t(`asset-source.delete-dialog.usage-list.warning-${assetType}-is-in-use`, {
                context: asset.originalFilename ? 'named' : 'unnamed',
                filename: asset.originalFilename,
              })}
            </Text>
          </Flex>
          {isImage && (
            <Card __unstable_checkered border radius={1} style={STYLE_CONFIRM_CARD}>
              <Flex align="center" justify="center" style={STYLE_IMAGE_WRAPPER}>
                <img
                  src={`${asset.url}?w=200`}
                  style={STYLE_ASSET_IMAGE}
                  alt={t('asset-source.usage-list.image-alt')}
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
            <Translate
              t={t}
              i18nKey={`asset-source.delete-dialog.usage-list.confirm-delete-${assetType}`}
              context={asset.originalFilename ? 'named' : 'unnamed'}
              values={{filename: asset.originalFilename}}
            />
          </Text>
        </Flex>
        {isImage && (
          <Card __unstable_checkered border radius={1} style={STYLE_CONFIRM_CARD}>
            <Flex align="center" justify="center" style={STYLE_IMAGE_WRAPPER}>
              <img
                src={`${asset.url}?w=200`}
                style={STYLE_ASSET_IMAGE}
                alt={t('asset-source.asset-list.table.preview-alt')}
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </Flex>
          </Card>
        )}
      </Grid>
    </Card>
  )
}
