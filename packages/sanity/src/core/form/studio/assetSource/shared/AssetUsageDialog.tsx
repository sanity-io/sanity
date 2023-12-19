import React, {useMemo} from 'react'
import {Asset as AssetType} from '@sanity/types'
import {Dialog} from '../../../../../ui-components'
import {LoadingBlock} from '../../../../components/loadingBlock'
import {useReferringDocuments} from '../../../../hooks/useReferringDocuments'
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
        <LoadingBlock showText />
      ) : (
        <AssetUsageList
          asset={asset}
          referringDocuments={publishedDocuments}
          assetType={assetType}
        />
      )}
    </Dialog>
  )
}
