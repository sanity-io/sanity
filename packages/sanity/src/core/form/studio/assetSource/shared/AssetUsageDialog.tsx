import React, {useMemo} from 'react'
import {Box, Dialog, Stack} from '@sanity/ui'
import {Asset as AssetType} from '@sanity/types'
import {useReferringDocuments} from '../../../../hooks/useReferringDocuments'
import {SpinnerWithText} from '../../../components/SpinnerWithText'
import {useTranslation} from '../../../../i18n'
import {AssetUsageList} from './AssetUsageList'

export interface UsageDialogProps {
  assetType: 'file' | 'image'
  asset: AssetType
  onClose: () => void
}

export function AssetUsageDialog({asset, assetType, onClose}: UsageDialogProps) {
  const {isLoading, referringDocuments} = useReferringDocuments(asset._id)

  const publishedDocuments = useMemo(() => {
    const drafts = referringDocuments.reduce<string[]>(
      (acc, doc) => (doc._id.startsWith('drafts.') ? acc.concat(doc._id.slice(7)) : acc),
      [],
    )

    return referringDocuments.filter((doc) => !drafts.includes(doc._id))
  }, [referringDocuments])

  const {t} = useTranslation()

  return (
    <Dialog
      __unstable_autoFocus
      header={t('asset-source.asset-usage-dialog.header', {context: assetType})}
      id="asset-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      width={1}
    >
      {isLoading ? (
        <Box padding={4}>
          <SpinnerWithText text={t('asset-source.asset-usage-dialog.loading')} />
        </Box>
      ) : (
        <Stack paddingX={[2, 3, 4]} paddingY={[3, 3, 3, 4]} space={1}>
          <AssetUsageList
            asset={asset}
            referringDocuments={publishedDocuments}
            assetType={assetType}
          />
        </Stack>
      )}
    </Dialog>
  )
}
